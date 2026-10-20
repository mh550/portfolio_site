// A visitor id is a UUID v4: version nibble 4, RFC 4122 variant (8, 9, a or b), either case.
// The token route and the /talk client both use this, so they agree on what an id is.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(s: unknown): boolean {
  return typeof s === 'string' && UUID_V4.test(s);
}
