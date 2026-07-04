// ---------------------------------------------------------------------------
// ONE-TIME LINK TOKENS — HMAC signing (edge-safe, uses Web Crypto).
// ---------------------------------------------------------------------------
// A link token is `<id>.<sig>` where sig = HMAC-SHA256(id, LINK_SECRET). The id
// is any URL-safe string the bot picks (e.g. a random uuid). Signing means only
// the holder of LINK_SECRET (this app + your WhatsApp bot) can mint valid
// tokens, so nobody can fabricate a working link. "Used exactly once" is then
// enforced separately by burning the id in the store (see gate.ts).
// ---------------------------------------------------------------------------

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64url(new Uint8Array(sig));
}

// constant-time-ish string compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken(id: string, secret: string): Promise<string> {
  return `${id}.${await hmac(secret, id)}`;
}

// Returns the id if the token's signature is valid, else null.
export async function verifyToken(token: string, secret: string): Promise<string | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(secret, id);
  return safeEqual(sig, expected) ? id : null;
}

// A short-lived session token (so a page reload within the grace window is not
// treated as a second use). value = `<id>~<game>~<exp>.<sig>`.
export async function signSession(id: string, game: string, expMs: number, secret: string): Promise<string> {
  const payload = `${id}~${game}~${expMs}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifySession(
  value: string,
  game: string,
  nowMs: number,
  secret: string
): Promise<boolean> {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!safeEqual(sig, await hmac(secret, payload))) return false;
  const [, g, expStr] = payload.split("~");
  return g === game && Number(expStr) > nowMs;
}
