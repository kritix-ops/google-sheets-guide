import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetCryptoForTests,
  decryptToken,
  encryptToken,
} from "../crypto";

const ORIGINAL_SECRET = process.env.AUTH_SECRET;

describe("account token crypto", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET =
      "test-secret-long-enough-and-random-for-hkdf-derivation";
    _resetCryptoForTests();
  });
  afterEach(() => {
    if (ORIGINAL_SECRET == null) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = ORIGINAL_SECRET;
    _resetCryptoForTests();
  });

  it("round-trips a token", () => {
    const plain = "ya29.a0AfH6SMC-very-long-fake-refresh-token-value-here";
    const enc = encryptToken(plain);
    expect(enc).toMatch(/^v1:/);
    expect(enc).not.toContain(plain);
    expect(decryptToken(enc)).toBe(plain);
  });

  it("returns legacy plaintext as-is", () => {
    // Tokens stored before this layer landed had no v1: prefix. We must
    // keep reading them so existing users don't get logged out.
    expect(decryptToken("legacy-plaintext-token")).toBe(
      "legacy-plaintext-token",
    );
  });

  it("throws on tampered ciphertext under the same key", () => {
    const enc = encryptToken("the-real-token");
    // Decode the blob, flip a byte in the ciphertext, re-encode. This is
    // deterministic — unlike a string-level character swap, which would
    // only sometimes land inside the encrypted segment.
    const [, nonceB64, blobB64] = enc.split(":");
    const blob = Buffer.from(blobB64!, "base64");
    blob[0] = (blob[0]! ^ 0xff) & 0xff;
    const tampered = `v1:${nonceB64}:${blob.toString("base64")}`;
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("throws when decrypting under a different secret", () => {
    const enc = encryptToken("the-real-token");
    process.env.AUTH_SECRET = "a-totally-different-secret-value";
    _resetCryptoForTests();
    expect(() => decryptToken(enc)).toThrow();
  });

  it("produces a different ciphertext each call (random nonce)", () => {
    const a = encryptToken("same-input");
    const b = encryptToken("same-input");
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe("same-input");
    expect(decryptToken(b)).toBe("same-input");
  });
});
