import 'server-only';

// The token route's LiveKit settings (spec W1), read on the server only: the route signs with them, and the root layout
// passes ConciergeProvider just whether they are there (D46, D85). Null when any is missing or the url is not wss://.
export interface ConciergeEnv {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export function conciergeEnv(env: Record<string, string | undefined> = process.env): ConciergeEnv | null {
  const url = env.LIVEKIT_URL;
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  if (!url?.startsWith('wss://') || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}
