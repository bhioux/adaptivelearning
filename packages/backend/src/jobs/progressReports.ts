import type { Job } from "bullmq";
import { logger } from "../lib/logger";

/**
 * Progress reports worker.
 * TODO (Phase 2): aggregate weekly progress per student and enqueue email/notification jobs.
 */
export async function runProgressReportsJob(_job: Job): Promise<void> {
  logger.info("progress-reports job: stub (aggregation + notifications not wired yet)");
}
