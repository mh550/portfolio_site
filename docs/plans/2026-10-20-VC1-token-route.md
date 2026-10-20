# VC1 — Token route and LiveKit dependencies

Spec: `docs/specs/2026-10-19-voice-concierge-page.md` §2 W1, §3, §4 (the contract with the agent) and §5. VC1 has
three features: VC1-01 (this plan + the packages), VC1-02 (the route and its tests), VC1-03 (review for leaks,
simplify, CLAUDE.md). Policy is build-only: no LiveKit env anywhere in the suite, the smoke or the dev server.

## Packages (D41)

Installed with `npm i -E`, the latest of each on npm on 2026-10-20 (`npm view <pkg> version`):

| Package | Pin | Used by |
|---|---|---|
| `livekit-server-sdk` | 2.19.1 | the token route (server only) |
| `livekit-client` | 2.23.0 | `/talk` (VC2), the `Room` |
| `@livekit/components-react` | 2.9.24 | `/talk` (VC2), `RoomContext.Provider` + `RoomAudioRenderer`; peer `livekit-client ^2.20.1`, `react >=18`, `tslib ^2.6.2` (already in the tree) |

**Not installed: `@livekit/components-styles`.** The panels are Tailwind on the site's design tokens, and the only
LiveKit component the page renders, `RoomAudioRenderer`, draws no visible UI: in 2.9.24 it returns
`<div style={{ display: "none" }}>` holding one audio element per remote audio track
(`dist/prefabs-BEB1UEnC.mjs`). `@livekit/components-react` is `sideEffects: false` and imports no CSS.

Two copies of `@livekit/protocol` land in `node_modules`: 1.52.1 at the top (from `livekit-client`) and 1.51.0
under `node_modules/livekit-server-sdk/node_modules/` (what the server SDK imports). `RoomConfiguration` and
`RoomAgentDispatch` are declared identically in both. Their declarations live in `dist/index.d.ts`; this protocol
version has no `dist/gen/livekit_room_pb.d.ts` (the path the feature step names).

## Signatures the route relies on (quoted from the installed types)

`node_modules/livekit-server-sdk/dist/AccessToken.d.ts` (2.19.1):

```ts
interface AccessTokenOptions {
    ttl?: number | string;        // "expressed in seconds or a string describing a time span zeit/ms"
    name?: string;
    identity?: string;            // "identity of the user, required for room join tokens"
    metadata?: string;
    attributes?: Record<string, string>;
}
declare class AccessToken {
    constructor(apiKey?: string, apiSecret?: string, options?: AccessTokenOptions);
    addGrant(grant: VideoGrant): void;
    get roomConfig(): RoomConfiguration | undefined;
    set roomConfig(config: RoomConfiguration | undefined);
    toJwt(): Promise<string>;     // "@returns JWT encoded token"
}
```

`toJwt()` (`dist/AccessToken.js`) signs HS256 with jose: issuer = the API key, `setExpirationTime(this.ttl)`,
`setNotBefore(new Date())`, subject = identity, and throws `"identity is required for join but not set"` when a
`roomJoin` grant has no identity. It is pure: no network.

Note that the constructor falls back to `process.env.LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` when its arguments are
undefined. The route checks the env itself first and always passes both values explicitly.

`node_modules/livekit-server-sdk/dist/grants.d.ts`, the `VideoGrant` fields used:

```ts
interface VideoGrant {
    roomJoin?: boolean;        // "permission to join a room as a participant, room must be set"
    room?: string;             // "name of the room, must be set for admin or join permissions"
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;  // "allow participants to publish data, defaults to true if not set"
    // also: roomCreate, roomList, roomRecord, roomAdmin, ingressAdmin, canPublishSources, canUpdateOwnMetadata,
    // hidden, recorder, agent, canSubscribeMetrics, canManageAgentSession, destinationRoom (all unused)
}
interface ClaimGrants extends JWTPayload { name?; video?: VideoGrant; metadata?; attributes?; roomConfig?: RoomConfiguration; … }
```

`node_modules/livekit-server-sdk/node_modules/@livekit/protocol/dist/index.d.ts` (1.51.0; re-exported by
`livekit-server-sdk`'s `dist/index.d.ts`, so import both from `livekit-server-sdk`):

```ts
declare class RoomConfiguration extends Message<RoomConfiguration> {
  name: string;               // "Used as ID, must be unique"
  emptyTimeout: number;       // "number of seconds to keep the room open if no one joins"
  departureTimeout: number;   // "number of seconds to keep the room open after everyone leaves"
  maxParticipants: number;
  metadata: string;
  egress?: RoomEgress;
  minPlayoutDelay: number;
  maxPlayoutDelay: number;
  syncStreams: boolean;
  agents: RoomAgentDispatch[];
  tags: { [key: string]: string };
  constructor(data?: PartialMessage<RoomConfiguration>);
}
declare class RoomAgentDispatch extends Message<RoomAgentDispatch> {
  agentName: string;
  metadata: string;
  restartPolicy: JobRestartPolicy;
  deployment: string;
  attributes: { [key: string]: string };
  constructor(data?: PartialMessage<RoomAgentDispatch>);
}
```

## One minted token, decoded

A 10-line script (`$HARNESS_SCRATCH/mint/mint.mjs`, run from the repo root against the installed SDK) with a
throwaway key `'k'.repeat(12)` and secret `'s'.repeat(32)`:

```js
const at = new AccessToken(key, secret, { identity: `visitor-${visitorId}`, ttl: 600 });
at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
at.roomConfig = new RoomConfiguration({ emptyTimeout: 30, agents: [new RoomAgentDispatch({
  agentName: 'concierge', metadata: JSON.stringify({ visitor_id: visitorId, channel_hint: 'web' }) })] });
const jwt = await at.toJwt();
```

Header `{"alg": "HS256"}`. Payload:

```json
{
  "video": {
    "roomJoin": true,
    "room": "concierge-1c12c95a9f19",
    "canPublish": true,
    "canSubscribe": true,
    "canPublishData": true
  },
  "roomConfig": {
    "name": "",
    "emptyTimeout": 30,
    "departureTimeout": 0,
    "maxParticipants": 0,
    "minPlayoutDelay": 0,
    "maxPlayoutDelay": 0,
    "syncStreams": false,
    "agents": [
      {
        "agentName": "concierge",
        "metadata": "{\"visitor_id\":\"0b9f6f0e-6a3d-4c1e-9b8a-2f1d3c4e5a6b\",\"channel_hint\":\"web\"}",
        "restartPolicy": "JRP_ON_FAILURE",
        "deployment": "",
        "attributes": {}
      }
    ],
    "metadata": "",
    "tags": {}
  },
  "iss": "kkkkkkkkkkkk",
  "exp": 1792470834,
  "nbf": 1792470234,
  "sub": "visitor-0b9f6f0e-6a3d-4c1e-9b8a-2f1d3c4e5a6b"
}
```

What the tests assert, then: `sub` = `visitor-<id>`; `video.room` matches `^concierge-[0-9a-f]{12}$` and
`video.roomJoin/canPublish/canSubscribe/canPublishData` are `true`; `roomConfig.emptyTimeout` = 30;
`roomConfig.agents[0].agentName` = `concierge`; `JSON.parse(roomConfig.agents[0].metadata)` equals
`{visitor_id: <id>, channel_hint: 'web'}` (the metadata is a JSON **string**); `exp - nbf` = 600. There is **no
`iat`** claim: the SDK sets `nbf`, not `iat`. `iss` is the API key, which is public by design (it names the key, it
does not sign). `roomConfig.name` stays empty; the room is named by the video grant.

## Route behaviour (`src/app/api/concierge/token/route.ts`, VC1-02)

| Input | Response |
|---|---|
| any of `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` missing or empty, or `LIVEKIT_URL` not starting with `wss://` | `503 {"offline": true}`. Checked **first**, before the body is read, so an offline site answers the same to every request |
| body is not JSON, not an object, or has no string `visitor_id` | `400 {"error": "bad_request"}` |
| `visitor_id` not a UUID v4 (`isUuidV4`, case-insensitive, version nibble 4, variant 8/9/a/b) | `400 {"error": "bad_request"}` |
| valid | `200 {"url": LIVEKIT_URL, "token": <jwt>}`, nothing else in the body |
| `toJwt()` throws (should not happen with env set) | `500 {"error": "token_failed"}`, no detail echoed |

Superseded in part by VC5-04 (D63, D68): an Origin check now answers 403 before the env check, and between the
body and the token the route lists live rooms (503 on failure, 429 when busy); rooms are `concierge-<addr10>-<12 hex>`.
See `docs/plans/2026-10-20-VC5-mic-limits-server-only.md` § Route behaviour.

- Only `POST` is exported; Next answers other methods with 405.
- Room: `concierge-` + 12 lowercase hex from `crypto.randomBytes(6)` (Node `crypto`, imported in the route).
- Identity `visitor-<visitor_id>` with the id lower-cased (D43, VC1-03); `ttl: 600` (seconds; a number, not a string).
- Grants: `{ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true }`.
- `roomConfig = new RoomConfiguration({ emptyTimeout: 30, agents: [new RoomAgentDispatch({ agentName: 'concierge',
  metadata: JSON.stringify({ visitor_id, channel_hint: 'web' }) })] })`. The 10-minute session cap is the agent's
  (§4, B7), not the token's; the token's 600 s only bounds when it can be used to join.
- `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'`. Env is read inside the handler on
  every request (never at module scope), so a test can set and unset it between cases and Vercel preview env applies
  without a rebuild. Every response carries `Cache-Control: no-store`.
- Plain `Response.json(...)`, like `michael-herron.vcf/route.ts`, so the Jest test calls `POST(new Request(...))`
  directly.
- `isUuidV4` lives in `src/lib/concierge/visitorId.ts` (VC1-02 creates it with only that function; VC2-02 adds the
  `localStorage` helper next to it). The client imports the same function, so the two sides agree on what an id is.
- No logging of the body, the id or the token.

## Tests (VC1-02, spec §5 "Token route")

`src/__tests__/app/concierge-token-route.test.ts`, with `/** @jest-environment node */` on line 1. It is needed: under
the default jsdom environment Jest resolves jose's `browser` export (ESM) and the import fails; under `node` it
resolves `require` → `dist/node/cjs`. Checked tonight: a throwaway Jest test in the node environment imported
`livekit-server-sdk`, minted and decoded a token, and passed (then deleted).

1. 503 `{offline: true}` with no env; and with each of the three missing in turn; and with `LIVEKIT_URL` = `https://…`.
2. 400 on an unparseable body, on `{}`, on `visitor_id: 42`, on a v1 UUID, on a UUID-shaped string with a bad variant,
   on `'not-a-uuid'`.
3. 200: the body's keys are exactly `['token', 'url']`; `url` is the env value; the decoded payload carries the claims
   listed above (decode with `Buffer.from(jwt.split('.')[1], 'base64url')`), and verifying with
   `new TokenVerifier(key, secret).verify(token)` succeeds (the token is really signed with the env secret).
4. Two calls give two different rooms.
5. `runtime === 'nodejs'`, `dynamic === 'force-dynamic'`, `Cache-Control: no-store`.
6. `src/__tests__/lib/concierge-visitor-id.test.ts`: `isUuidV4` true for `crypto.randomUUID()` and an upper-case v4,
   false for v1/v7, wrong variant, wrong length, non-strings.

D42 (recorded by VC1-02): the route test signs a real token with the real SDK and fake env, then decodes it; the
spec's "tests mock the SDK" is applied to `livekit-client` and `@livekit/components-react`, which VC2 mocks in Jest.

**Fake secrets and the content guard.** `content-guard.test.ts` scans tests too and fails on
`/(api[_-]?key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}/i`. Set fakes from expressions, never quoted literals
of 12+ characters after `secret =`, `token:` or `api_key =`:

```ts
process.env.LIVEKIT_URL = 'wss://example.livekit.cloud';
process.env.LIVEKIT_API_KEY = 'k'.repeat(12);
process.env.LIVEKIT_API_SECRET = 'x'.repeat(32);
```

Save and restore `process.env` in `beforeEach`/`afterEach` so no other suite sees these values.

## Review (VC1-03)

Diff: `git diff 4b603a8..HEAD -- . ':!package-lock.json'` (652 lines) in the run's scratch dir, read by an Opus
reviewer. No Critical findings. Tests 674 → 680, suites 59 → 60.

| File | Finding | Severity | Outcome |
|---|---|---|---|
| `concierge-token-route.test.ts` | `exp - (iat ?? nbf) === 600` is flaky: the SDK reads the clock for `exp` and again for `nbf` (`AccessToken.js:122`), so a second boundary between them gives 599. A throwaway test that stepped `Date#getTime` across a boundary got `Received: 599` | Important | Fixed: the claims test runs on a frozen clock (`jest.useFakeTimers({ now })`) and pins `nbf === now` and `exp === nbf + 600`; the dead `iat ??` is gone |
| `route.ts` | Upper- and lower-case forms of one id gave two identities and two agent-side visitors | Minor | Fixed (D43 *default*): the id is lower-cased; the test went red first, then green |
| `concierge-token-route-sdk.test.ts` (new) | The 500 path (`token_failed`) had no test | Minor | Added: `toJwt` rejects with an error carrying the secret; the body is exactly `{error:'token_failed'}`, `no-store`, no `boom`/`LIVEKIT`/`stack`/secret |
| `concierge-token-route-sdk.test.ts` (new) | Nothing showed a bad id stops before the SDK | Minor | Added: 37-char, 10 000-char and v1 ids → 400 with `addGrant` and `toJwt` spies never called. A separate file keeps `concierge-token-route.test.ts` mock-free (D42) |
| `concierge-token-route.test.ts` | No test showed extra body fields are ignored | Minor | Added: `identity`, `room`, `ttl`, `agentName` in the body change nothing |
| `visitorId.ts`, `route.ts` | `isUuidV4` returned `boolean`, so the route cast `id as string`; `readVisitorId` had redundant `typeof`/`null` checks | Nit | Simplified: `isUuidV4(s): s is string`; `readVisitorId` is one optional-chained read |
| `concierge-token-route.test.ts` | `not.toHaveProperty('token')` after `toEqual({error})` is redundant | Nit | Kept: it reads as VC1-02 step 2 ("no `token` key") |
| `route.ts` | `request.json()` parses a body of any size | Nit | Kept: Vercel caps request bodies at 4.5 MB, and an oversized id is rejected before the SDK (test above) |
| `route.ts` | No Origin check or rate limit, so any script can mint tokens, and each joined room dispatches a paid agent | Minor (out of scope) | Asked of Michael in progress.md; proposed for a later milestone (the agent's 10-minute cap bounds each session) |

Checks, with evidence:

- **No `LIVEKIT_*` value reaches the client.** `grep -rn LIVEKIT src/components src/app --include=*.tsx` is empty;
  `grep -rl LIVEKIT_API .next-check/static` is empty after the VC1-03 build. Only `route.ts` reads
  `process.env.LIVEKIT_*`; `livekit-server-sdk` is imported only there; no `NEXT_PUBLIC_` variable exists.
- **Error bodies carry no stack, env names or secret.** All four bodies are literals (`{offline:true}`,
  `{error:'bad_request'}`, `{error:'token_failed'}`, `{url, token}`); both `catch` blocks drop the error. Pinned by the
  500 test and "contains neither the key nor the secret".
- **Identity and room derive only from the validated id and server randomness.** `identity: visitor-${visitorId}`
  (the id after `isUuidV4`, lower-cased), `room = concierge-${randomBytes(6).toString('hex')}`; only `visitor_id` is
  read from the body. Pinned by "ignores every body field but visitor_id".
- **An id longer than 36 characters is rejected before any SDK call.** The `isUuidV4` regex is anchored (no `m`
  flag) and `readVisitorId` returns before `new AccessToken`. Pinned by the SDK-spy tests (37 and 10 000 chars).
- **Content guard.** `npx jest src/__tests__/lib/content-guard.test.ts`: 20/20 green on this tree, including the new
  test file's `'x'.repeat(32)` fake secret.

## Live step (for Michael; the harness never does this)

1. In Vercel → Project → Settings → Environment Variables, **Preview** scope only first: `LIVEKIT_URL`
   (`wss://<project>.livekit.cloud`), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` from the LiveKit Cloud project's keys.
2. Open the preview deployment of the PR branch and run in the browser console:
   `await (await fetch('/api/concierge/token', {method: 'POST', body: JSON.stringify({visitor_id: crypto.randomUUID()})})).json()`.
   Expect `{url, token}`; paste the token into jwt.io (or decode the middle segment) and check `sub`, `video.room`,
   `roomConfig.agents[0]`.
3. With `visitor_id: 'x'` expect 400; remove one variable on a throwaway preview and expect `503 {offline: true}`.
4. Only after `/talk` works on the preview (VC2's morning check), add the same three to **Production**.
5. Undo: delete the three variables (the route answers 503 and `/talk` shows its offline state); rotate the LiveKit
   key in LiveKit Cloud if it was ever exposed.
