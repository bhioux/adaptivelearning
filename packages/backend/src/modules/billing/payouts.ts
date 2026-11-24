import { prisma } from "../../db/prisma";

/**
 * Verified-work → payout aggregation. Verified logs become due payouts; when a
 * payout is created, the work logs are marked PROCESSED.
 */
export interface DuePayout {
  tutorId: string;
  amount: number;
  hoursWorked: number;
  ratePerHour: number;
}

export async function calculateDuePayouts(): Promise<DuePayout[]> {
  const logs = await prisma.tutor_work_logs.findMany({
    where: { verified: true, payout_status: "PENDING" },
  });
  const byTutor = new Map<string, DuePayout>();
  for (const log of logs) {
    const amount = log.hours_worked * log.rate_per_hour;
    const existing = byTutor.get(log.tutor_id);
    if (existing) {
      existing.hoursWorked += log.hours_worked;
      existing.amount += amount;
      // One rate per row — for differing rates, pro-rate (TODO Phase 2).
      existing.ratePerHour = log.rate_per_hour;
    } else {
      byTutor.set(log.tutor_id, {
        tutorId: log.tutor_id,
        amount,
        hoursWorked: log.hours_worked,
        ratePerHour: log.rate_per_hour,
      });
    }
  }
  const payouts = Array.from(byTutor.values());
  if (payouts.length > 0) {
    await prisma.$transaction([
      ...payouts.map((p) =>
        prisma.payouts.create({
          data: { tutor_id: p.tutorId, amount: p.amount, method: "bank_transfer", status: "PENDING" },
        }),
      ),
      prisma.tutor_work_logs.updateMany({
        where: { verified: true, payout_status: "PENDING" },
        data: { payout_status: "PROCESSED" },
      }),
    ]);
  }
  return payouts;
}
