import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { signAttemptToken, verifyAttemptToken } from "../sidebar-token";

const ORIGINAL_SECRET = process.env.AUTH_SECRET;

describe("sidebar-token", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-must-be-long-enough-and-random";
  });
  afterEach(() => {
    if (ORIGINAL_SECRET == null) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = ORIGINAL_SECRET;
  });

  it("round-trips a valid token", () => {
    const token = signAttemptToken(42);
    const v = verifyAttemptToken(token);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.attemptId).toBe(42);
  });

  it("rejects a malformed token", () => {
    const v = verifyAttemptToken("not-a-token");
    expect(v).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a tampered payload", () => {
    const token = signAttemptToken(42);
    const [payload, sig] = token.split(".");
    // Flip a byte in the payload (re-encode an attempt that is decoded as
    // attemptId=43, signature stays bound to 42)
    const tampered = signAttemptToken(43).split(".")[0] + "." + sig;
    const v = verifyAttemptToken(tampered);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe("bad_signature");
    // sanity: original still passes
    const v2 = verifyAttemptToken(`${payload}.${sig}`);
    expect(v2.ok).toBe(true);
  });

  it("rejects an expired token", () => {
    const token = signAttemptToken(7, -1); // ttl in the past
    const v = verifyAttemptToken(token);
    expect(v).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects when signed under a different secret", () => {
    const token = signAttemptToken(99);
    process.env.AUTH_SECRET = "a-totally-different-secret-value";
    const v = verifyAttemptToken(token);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe("bad_signature");
  });
});
