import 'server-only';
import { RoomServiceClient } from 'livekit-server-sdk';
import type { ConciergeEnv } from './env';

// The LiveKit project's live rooms, for the token route's limits (plan docs/plans/2026-10-20-VC5-mic-limits-server-only.md
// § Modules). One bounded 5 s attempt with no region failover (D68); a rejection passes through so the route fails
// closed. The SDK turns the wss:// url into https:// itself.
export async function listLiveRooms(env: ConciergeEnv): Promise<{ name: string }[]> {
  const client = new RoomServiceClient(env.url, env.apiKey, env.apiSecret, {
    requestTimeout: 5,
    failover: false,
  });
  const rooms = await client.listRooms();
  return rooms.map(({ name }) => ({ name }));
}
