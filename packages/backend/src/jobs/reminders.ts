import type { Job } from "bullmq";
import { logger } from "../lib/logger";

/**
 * Reminders worker.
 * TODO (Phase 2): query students with due reminders (upcoming assessments,
 * streak continuation, practice goals) and enqueue notification jobs through
 * the notification service (OneSignal push + Resend email).
 */
export async function runRemindersJob(_job: Job): Promise<void> {
  logger.info("reminders job: stub (no reminders due)");
}
