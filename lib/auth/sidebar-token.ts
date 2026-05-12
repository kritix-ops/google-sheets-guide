import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// HMAC-signed attempt token for the in-sheet sidebar. The Apps Script
// sandbox iframe is cross-site to our origin, so our SameSite=lax session
// cookie does not flow into it. The grade endpoint instead authorizes via
// a short token signed at provisioning time, carrying the attemptId and an
// expiry. Without this, anyone could POST a guessed integer attemptId and
// trigger paid Sheets + Anthropic API calls on the owner's behalf.

const ALG = "sha256";
const DEFAULT_TTL_DAYS = 14;

type Payload = {
  // attempt id
  a: number;
  // expiry, unix ms
  e: number;
  // nonce, ensures unique tokens even for identical attempt+exp
  n: string;
};

function getSecret(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be set to sign sidebar attempt tokens",
    );
  }
  return Buffer.from(secret, "utf-8");
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export function signAttemptToken(
  attemptId: number,
  ttlDays: number = DEFAULT_TTL_DAYS,
): string {
  const payload: Payload = {
    a: attemptId,
    e: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    n: randomBytes(12).toString("hex"),
  };
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const mac = createHmac(ALG, getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(mac)}`;
}

export type VerifyResult =
  | { ok: true; attemptId: number; expiresAt: number }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyAttemptToken(token: string): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return { ok: false, reason: "malformed" };

  const expected = createHmac(ALG, getSecret()).update(payloadB64).digest();
  const got = b64urlDecode(sigB64);
  if (got.length !== expected.length) {
    return { ok: false, reason: "bad_signature" };
  }
  if (!timingSafeEqual(got, expected)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf-8")) as Payload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof payload.a !== "number" ||
    typeof payload.e !== "number" ||
    typeof payload.n !== "string"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (payload.e < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, attemptId: payload.a, expiresAt: payload.e };
}
