import { randomBytes } from 'node:crypto';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { conciergeEnv } from '@/lib/concierge/env';
import { isUuidV4 } from '@/lib/concierge/visitorId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Contract with the agent: docs/specs/2026-10-19-voice-concierge-page.md §4. Behaviour table:
// docs/plans/2026-10-20-VC1-token-route.md § Route behaviour.
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
  // Env is read per request: offline (503) is decided before the body is touched.
  const env = conciergeEnv();
  if (!env) return reply({ offline: true }, 503);
  const { url, apiKey, apiSecret } = env;

  const visitorId = await readVisitorId(request);
  if (!visitorId) return reply({ error: 'bad_request' }, 400);

  const room = `concierge-${randomBytes(6).toString('hex')}`;
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
