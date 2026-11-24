import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export function initOtel(): void {
  if (!env.OTEL_ENDPOINT) {
    logger.info("OpenTelemetry disabled — OTEL_ENDPOINT not set");
    return;
  }
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: `${env.OTEL_ENDPOINT}/v1/traces` }),
  });
  sdk.start();
  logger.info({ endpoint: env.OTEL_ENDPOINT }, "OpenTelemetry SDK started");
}
