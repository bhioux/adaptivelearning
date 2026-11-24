import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgres://localhost/db");
  vi.stubEnv("REDIS_URL", "redis://localhost:6379");
  vi.stubEnv("JWT_ACCESS_SECRET", "test-access-secret");
  vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret");
});

describe("auth tokens", () => {
  it("signs and verifies access tokens", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../src/lib/tokens");
    const token = signAccessToken({ id: "u1", email: "a@b.c", role: "STUDENT" });
    const payload = verifyAccessToken(token);
    expect(payload?.sub).toBe("u1");
    expect(payload?.role).toBe("STUDENT");
    expect(verifyAccessToken("garbage")).toBeNull();
  });

  it("creates refresh tokens with hash + expiry", async () => {
    const { createRefreshToken, hashRefreshToken } = await import("../src/lib/tokens");
    const { token, record } = createRefreshToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(record.tokenHash).toBe(hashRefreshToken(token));
    expect(record.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("hashes refresh tokens deterministically", async () => {
    const { hashRefreshToken } = await import("../src/lib/tokens");
    expect(hashRefreshToken("abc")).toBe(hashRefreshToken("abc"));
    expect(hashRefreshToken("abc")).not.toBe(hashRefreshToken("abd"));
  });
});
