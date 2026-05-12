import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

// Application-level encryption for OAuth tokens at rest. The Drizzle
// adapter stores Auth.js account tokens as plaintext text columns; an
// attacker with read-only access to libSQL (or a leaked Turso read token)
// would otherwise harvest long-lived Google refresh tokens for every
// signed-in user. We wrap the relevant columns in AES-GCM so the stored
// value is useless without AUTH_SECRET.
//
// Format on disk: `v1:<base64(nonce)>:<base64(ciphertext+tag)>`. Anything
// that does not match this shape is assumed to be a legacy plaintext row
// from before this encryption layer landed; we return it as-is. Every
// fresh write is encrypted, so the corpus drifts toward fully-encrypted
// as access tokens refresh on each sign-in.

const KEY_INFO = Buffer.from("sheets-guide.account-tokens.v1", "utf-8");
const PREFIX = "v1:";
const NONCE_BYTES = 12;
const KEY_BYTES = 32;

let cachedKey: Buffer | null = null;

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be set to encrypt account tokens at rest",
    );
  }
  // hkdfSync returns an ArrayBuffer; wrap in Buffer for crypto APIs.
  const derived = hkdfSync(
    "sha256",
    Buffer.from(secret, "utf-8"),
    Buffer.alloc(0),
    KEY_INFO,
    KEY_BYTES,
  );
  cachedKey = Buffer.from(derived);
  return cachedKey;
}

export function encryptToken(plaintext: string): string {
  const key = deriveKey();
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const enc = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([enc, tag]);
  return `${PREFIX}${nonce.toString("base64")}:${blob.toString("base64")}`;
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith(PREFIX)) {
    // Legacy plaintext row from before encryption was enabled. Return as-is
    // so existing users don't break; the next refresh will rewrite it
    // encrypted.
    return stored;
  }
  const rest = stored.slice(PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep === -1) return stored;
  const nonceB64 = rest.slice(0, sep);
  const blobB64 = rest.slice(sep + 1);
  let nonce: Buffer;
  let blob: Buffer;
  try {
    nonce = Buffer.from(nonceB64, "base64");
    blob = Buffer.from(blobB64, "base64");
  } catch {
    return stored;
  }
  if (nonce.length !== NONCE_BYTES || blob.length < 16) return stored;
  const enc = blob.subarray(0, blob.length - 16);
  const tag = blob.subarray(blob.length - 16);
  try {
    const key = deriveKey();
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf-8");
  } catch {
    // Tampered or wrong key. Returning the stored blob would mislead the
    // caller into using a non-token; throwing is the correct behavior.
    throw new Error("failed to decrypt account token");
  }
}

// Reset the cached key. Tests use this between cases that swap
// AUTH_SECRET to verify isolation.
export function _resetCryptoForTests(): void {
  cachedKey = null;
}
