import { Queue } from "bullmq";
import { logger } from "./logger";
import { env } from "../config/env";

const redisConnection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: 3,
  retryDelayOnDataAbort: 500,
  retryStrategy: undefined,
};

export type WorkerName = "reminders" | "progressReports" | "payouts";

export const workerNames: WorkerName[] = ["reminders", "progressReports", "payouts"];

export const queues: Record<WorkerName, Queue> = {
  reminders: new Queue("reminders", { connection: redisConnection }),
  progressReports: new Queue("progressReports", { connection: redisConnection }),
  payouts: new Queue("payouts", { connection: redisConnection }),
};

export interface JobData {
  [key: string]: unknown;
}

export interface JobEnqueueOptions {
  delay?: number;
  maxAttempts?: number;
}

export function enqueue<K extends WorkerName>(
  queueName: K,
  jobName: string,
  data: JobData,
  opts: JobEnqueueOptions = {},
): void {
  const queue = queues[queueName];
  void queue
    .add(jobName, data, {
      attempts: opts.maxAttempts ?? 3,
      backoff: { type: "exponential", delay: opts.delay ?? 1000 },
    })
    .then(() => logger.info({ queue: queueName, job: jobName, data }, "job enqueued"))
    .catch((err) => logger.error({ err, queue: queueName, job: jobName }, "failed to enqueue job"));
}

export async function startQueues(): Promise<void> {
  for (const queue of Object.values(queues)) {
    await queue.waitUntilReady();
  }
}

export async function stopQueues(): Promise<void> {
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
}

export async function closeAll(): Promise<void> {
  await Promise.all(workerNames.map((name) => queues[name].close()));
}
