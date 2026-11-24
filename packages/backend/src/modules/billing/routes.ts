import { Router, type Response, type NextFunction } from "express";
import { prisma } from "../../db/prisma";
import { requireRoles, type AuthedRequest } from "../../middleware/auth";
import { calculateDuePayouts } from "./payouts";

export const billingRouter: Router = Router();

const serializePayout = (p: { id: string; tutor_id: string; amount: number; method: string; status: string; created_at: Date; issued_at: Date | null; completed_at: Date | null }) => ({
  id: p.id,
  tutorId: p.tutor_id,
  amount: p.amount,
  method: p.method,
  status: p.status,
  createdAt: p.created_at.toISOString(),
  issuedAt: p.issued_at ? p.issued_at.toISOString() : null,
  completedAt: p.completed_at ? p.completed_at.toISOString() : null,
});

const serializeInvoice = (i: { id: string; customer_id: string; amount: number; currency: string; status: string; created_at: Date; paid_at: Date | null }) => ({
  id: i.id,
  customerId: i.customer_id,
  amount: i.amount,
  currency: i.currency,
  status: i.status,
  createdAt: i.created_at.toISOString(),
  paidAt: i.paid_at ? i.paid_at.toISOString() : null,
});

billingRouter.get("/billing/invoices", requireRoles("ADMIN", "STUDENT", "TUTOR", "PARENT"), async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const invoices = await prisma.invoices.findMany({ orderBy: { created_at: "desc" }, take: 100 });
    res.json({ invoices: invoices.map(serializeInvoice) });
  } catch (err) {
    next(err);
  }
});

billingRouter.get("/billing/payouts", requireRoles("ADMIN", "TUTOR"), async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const payouts = await prisma.payouts.findMany({ orderBy: { created_at: "desc" }, take: 100 });
    res.json({ payouts: payouts.map(serializePayout) });
  } catch (err) {
    next(err);
  }
});

billingRouter.get("/billing/tutor-stats/:tutorId", requireRoles("ADMIN", "TUTOR"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.tutor_work_logs.findMany({ where: { tutor_id: req.params.tutorId } });
    const totalHours = logs.reduce((sum, l) => sum + l.hours_worked, 0);
    const totalAmount = logs.reduce((sum, l) => sum + l.hours_worked * l.rate_per_hour, 0);
    const verified = logs.filter((l) => l.verified).length;
    const pendingPayouts = logs.filter((l) => l.payout_status === "PENDING").length;
    res.json({ tutorId: req.params.tutorId, totalHours, totalAmount, verifiedLogs: verified, pendingPayouts });
  } catch (err) {
    next(err);
  }
});

billingRouter.post("/billing/payouts", requireRoles("ADMIN"), async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const payouts = await calculateDuePayouts();
    res.json({ payouts: payouts.map((p) => ({ tutorId: p.tutorId, amount: p.amount })) });
  } catch (err) {
    next(err);
  }
});

export { prisma };
