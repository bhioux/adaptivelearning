import * as Sentry from "@sentry/node";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    logger.info("Sentry disabled — SENTRY_DSN not set");
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.5,
  });
  logger.info("Sentry initialized");
}
