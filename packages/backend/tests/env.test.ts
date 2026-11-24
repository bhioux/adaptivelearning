import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgres://localhost/db");
  vi.stubEnv("REDIS_URL", "redis://localhost:6379");
  vi.stubEnv("JWT_ACCESS_SECRET", "a");
  vi.stubEnv("JWT_REFRESH_SECRET", "b");
});

describe("parseEnv", () => {
  it("throws when required env vars are missing", async () => {
    const { parseEnv } = await import("../src/config/env");
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("applies defaults when optional vars are missing", async () => {
    const { parseEnv } = await import("../src/config/env");
    const env = parseEnv({ DATABASE_URL: "postgres://x", REDIS_URL: "redis://x", JWT_ACCESS_SECRET: "a", JWT_REFRESH_SECRET: "b" });
    expect(env.PORT).toBe(8000);
    expect(env.ACCESS_TOKEN_TTL_MINUTES).toBe(15);
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(30);
    expect(env.RATE_LIMIT_MAX).toBe(300);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(env.CORS_ORIGIN).toBeTruthy();
  });

  it("parses provided values", async () => {
    const { parseEnv } = await import("../src/config/env");
    const env = parseEnv({ DATABASE_URL: "postgres://x", REDIS_URL: "redis://x", JWT_ACCESS_SECRET: "a", JWT_REFRESH_SECRET: "b", PORT: "9000", ACCESS_TOKEN_TTL_MINUTES: "10" });
    expect(env.PORT).toBe(9000);
    expect(env.ACCESS_TOKEN_TTL_MINUTES).toBe(10);
  });
});
