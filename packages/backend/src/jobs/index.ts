import { Worker, type Job } from "bullmq";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { queues, workerNames } from "../lib/queue";
import { runRemindersJob } from "./reminders";
import { runProgressReportsJob } from "./progressReports";
import { runPayoutsJob } from "./payouts";

const PROCESSORS: Record<string, (job: Job) => Promise<void>> = {
  reminders: runRemindersJob,
  progressReports: runProgressReportsJob,
  payouts: runPayoutsJob,
};

export async function startWorkers(): Promise<void> {
  for (const name of workerNames) {
    const processor = PROCESSORS[name];
    if (!processor) continue;
    const worker = new Worker(name, processor, { connection: { url: env.REDIS_URL } });
    worker.on("completed", (job) => logger.info({ jobId: job.id, name }, "job completed"));
    worker.on("failed", (job, err) => logger.error({ jobId: job?.id ?? null, name, err }, "job failed"));
    await worker.waitUntilReady();
  }
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(Object.values(queues).map((q) => q.close()));
}
