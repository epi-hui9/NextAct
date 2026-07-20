/**
 * Cookie signing / verification helpers for the password gate.
 *
 * Uses the Web Crypto API (HMAC-SHA-256) so this module runs in both the Node
 * runtime (route handlers) and the Edge runtime (middleware). The signed token
 * carries no PII: it is just a constant marker signed with `AUTH_SECRET`.
 */

export const AUTH_COOKIE = "btt_access";

// The signed payload. Kept constant + opaque; its only job is to prove the
// holder passed the gate. Rotating AUTH_SECRET invalidates all cookies.
const TOKEN_PAYLOAD = "granted";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return toHex(signature);
}

/** Constant-time-ish string comparison to avoid trivial timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Create the signed cookie value to store after a successful gate. */
export async function createSessionToken(): Promise<string> {
  const signature = await sign(TOKEN_PAYLOAD, getSecret());
  return `${TOKEN_PAYLOAD}.${signature}`;
}

/** Verify a cookie value produced by {@link createSessionToken}. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (payload !== TOKEN_PAYLOAD || !signature) return false;
  const expected = await sign(TOKEN_PAYLOAD, getSecret());
  return safeEqual(signature, expected);
}

/** Compare a submitted password against the configured gate password. */
export function isPasswordCorrect(submitted: unknown): boolean {
  const expected = process.env.GATE_PASSWORD;
  if (!expected) {
    throw new Error("GATE_PASSWORD is not set");
  }
  return typeof submitted === "string" && safeEqual(submitted, expected);
}
