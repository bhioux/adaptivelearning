import "dotenv/config";
import express, { type Express } from "express";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errors";
import { usersRouter } from "./modules/users/routes";
import { classesRouter } from "./modules/classes/routes";
import { liveRouter } from "./modules/live/routes";
import { coursesRouter } from "./modules/courses/routes";
import { socialRouter } from "./modules/social/routes";
import { billingRouter } from "./modules/billing/routes";
import { newsRouter } from "./modules/news/routes";
import { proctoringRouter } from "./modules/proctoring/routes";
import { startWorkers } from "./jobs";
import { initSentry } from "./observability/sentry";
import { initOtel } from "./observability/otel";
import { startQueues } from "./lib/queue";

initSentry();
initOtel();

const app: Express = express();

app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

// Health check
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "backend", node: process.version }));

app.use("/api/v1", usersRouter);
app.use("/api/v1", classesRouter);
app.use("/api/v1", liveRouter);
app.use("/api/v1", coursesRouter);
app.use("/api/v1", socialRouter);
app.use("/api/v1", billingRouter);
app.use("/api/v1", newsRouter);
app.use("/api/v1", proctoringRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, node: process.version }, "API server listening");
  startWorkers().catch((err) => logger.error({ err }, "worker startup failed"));
  startQueues().catch((err) => logger.error({ err }, "queue startup failed"));
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received — shutting down");
  server.close(() => {
    logger.info("Server closed");
    void prisma.$disconnect().then(() => process.exit(0));
  });
});
