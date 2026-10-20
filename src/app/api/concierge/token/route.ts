import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { profile } from '@/lib/data';
import { conciergeEnv } from '@/lib/concierge/env';
import { addressBucket, addressOf, maxRooms, roomNameFor, roomsVerdict } from '@/lib/concierge/limits';
import { isAllowedOrigin } from '@/lib/concierge/origin';
import { listLiveRooms } from '@/lib/concierge/rooms';
import { isUuidV4 } from '@/lib/concierge/visitorId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Contract with the agent: docs/specs/2026-10-19-voice-concierge-page.md §4. Behaviour tables:
// docs/plans/2026-10-20-VC1-token-route.md and docs/plans/2026-10-20-VC5-mic-limits-server-only.md § Route behaviour
// (checked in that order: 403, 503, 400, 503, 429, 200). Nothing here logs: the address never leaves, and the bucket
// appears only in the caller's own token (video.room, D70).
const AGENT_NAME = 'concierge';
const TOKEN_TTL_SECONDS = 600;
const EMPTY_TIMEOUT_SECONDS = 30;

function reply(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Only visitor_id is read; any other field is ignored. Lower-cased so one visitor is one identity (D43).
async function readVisitorId(request: Request): Promise<string | null> {
  try {
    const id = ((await request.json()) as { visitor_id?: unknown } | null)?.visitor_id;
    return isUuidV4(id) ? id.toLowerCase() : null;
  } catch {
    return null;
  }
}

// Plain Response (not NextResponse) so the Jest node test can call POST() directly.
export async function POST(request: Request) {
  // Origin before env (D63), so a caller from outside learns nothing about whether LiveKit is configured. NODE_ENV is
  // read per request, the tests' seam; a production build inlines it as 'production'.
  const dev = process.env.NODE_ENV !== 'production';
  if (!isAllowedOrigin(request.headers.get('origin'), { siteUrl: profile.siteUrl, dev })) {
    return reply({ error: 'forbidden' }, 403);
  }

  // Env is read per request: offline (503) is decided before the body is touched.
  const env = conciergeEnv();
  if (!env) return reply({ offline: true }, 503);
  const { url, apiKey, apiSecret } = env;

  const visitorId = await readVisitorId(request);
  if (!visitorId) return reply({ error: 'bad_request' }, 400);

  // Fail closed: without the room list there is no limit to check (D68). The error is dropped.
  let rooms: { name: string }[];
  try {
    rooms = await listLiveRooms(env);
  } catch {
    return reply({ offline: true }, 503);
  }
  const bucket = addressBucket(addressOf(request.headers), apiSecret);
  const verdict = roomsVerdict(rooms, bucket, maxRooms(process.env));
  if (verdict) return reply({ error: 'busy', reason: verdict }, 429);

  const room = roomNameFor(bucket);
  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `visitor-${visitorId}`,
      ttl: TOKEN_TTL_SECONDS,
    });
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
    at.roomConfig = new RoomConfiguration({
      emptyTimeout: EMPTY_TIMEOUT_SECONDS,
      agents: [
        new RoomAgentDispatch({
          agentName: AGENT_NAME,
          metadata: JSON.stringify({ visitor_id: visitorId, channel_hint: 'web' }),
        }),
      ],
    });
    return reply({ url, token: await at.toJwt() }, 200);
  } catch {
    return reply({ error: 'token_failed' }, 500);
  }
}
