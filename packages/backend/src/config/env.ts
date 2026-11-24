export interface ParsedEnv {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string[];
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL_MINUTES: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
  OTEL_ENDPOINT: string | undefined;
  SENTRY_DSN: string | undefined;
  STRIPE_SECRET_KEY: string | undefined;
  STRIPE_WEBHOOK_SECRET: string | undefined;
  AI_SIDECAR_URL: string;
  LOG_LEVEL: string;
  SEED_PASSWORD: string;
}

const required = (input: Record<string, string | undefined>, name: string): string => {
  const value = input[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const int = (input: Record<string, string | undefined>, name: string, fallback: number): number => {
  const value = input[name];
  return value ? Number(value) : fallback;
};

export function parseEnv(input: Record<string, string | undefined>): ParsedEnv {
  return {
    NODE_ENV: input.NODE_ENV ?? "development",
    PORT: int(input, "PORT", 8000),
    CORS_ORIGIN: (input.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:5174,http://localhost:4173").split(","),
    DATABASE_URL: required(input, "DATABASE_URL"),
    REDIS_URL: required(input, "REDIS_URL"),
    JWT_ACCESS_SECRET: required(input, "JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: required(input, "JWT_REFRESH_SECRET"),
    ACCESS_TOKEN_TTL_MINUTES: int(input, "ACCESS_TOKEN_TTL_MINUTES", 15),
    REFRESH_TOKEN_TTL_DAYS: int(input, "REFRESH_TOKEN_TTL_DAYS", 30),
    RATE_LIMIT_MAX: int(input, "RATE_LIMIT_MAX", 300),
    RATE_LIMIT_WINDOW_MS: int(input, "RATE_LIMIT_WINDOW_MS", 60_000),
    OTEL_ENDPOINT: input.OTEL_ENDPOINT,
    SENTRY_DSN: input.SENTRY_DSN,
    STRIPE_SECRET_KEY: input.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: input.STRIPE_WEBHOOK_SECRET,
    AI_SIDECAR_URL: input.AI_SIDECAR_URL ?? "http://localhost:8010",
    LOG_LEVEL: input.LOG_LEVEL ?? "info",
    SEED_PASSWORD: input.SEED_PASSWORD ?? "adaptivelearning-dev-pass",
  };
}

export const env: ParsedEnv = parseEnv(process.env);
