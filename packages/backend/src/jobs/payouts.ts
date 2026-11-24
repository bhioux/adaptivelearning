import type { Job } from "bullmq";
import { logger } from "../lib/logger";
import { calculateDuePayouts } from "../modules/billing/payouts";

export async function runPayoutsJob(_job: Job): Promise<void> {
  const payouts = await calculateDuePayouts();
  logger.info({ payouts: payouts.length, total: payouts.reduce((s, p) => s + p.amount, 0) }, "payouts job done");
}
