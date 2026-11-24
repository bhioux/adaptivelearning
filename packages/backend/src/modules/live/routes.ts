import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { AppError, badRequest, notFound } from "../../errors/AppError";
import { prisma } from "../../db/prisma";
import { requireRoles, type AuthedRequest } from "../../middleware/auth";
import type { LiveSessionSummary } from "@al/shared";
import { SNEAK_PEEK_MAX_SECONDS } from "@al/shared";

export const liveRouter: Router = Router();

// --- helpers ---

function generateRoomId(): string {
  const now = new Date().toISOString().replace(/[^0-9]/g, "").slice(2, 14);
  return `room-${now}-${Math.random().toString(36).slice(2, 8)}`;
}

const toLiveSession = (s: { id: string; class_arm_id: string; room_id: string; started_at: Date; ended_at: Date | null }) => ({
  id: s.id,
  classArmId: s.class_arm_id,
  roomId: s.room_id,
  startedAt: s.started_at.toISOString(),
  endedAt: s.ended_at ? s.ended_at.toISOString() : null,
}) as LiveSessionSummary;

const toSneakPeekLog = (l: { id: string; parent_id: string; session_id: string; accessed_at: Date; duration_seconds: number }) => ({
  id: l.id,
  parentId: l.parent_id,
  sessionId: l.session_id,
  accessedAt: l.accessed_at.toISOString(),
  durationSeconds: l.duration_seconds,
});

// --- routes ---

liveRouter.post("/live/sessions", requireRoles("ADMIN", "TUTOR"), async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({ classArmId: z.string().min(1, "classArmId is required") }).safeParse(_req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const arm = await prisma.class_arms.findUnique({ where: { id: parsed.data.classArmId } });
    if (!arm) throw notFound("Class arm not found");
    const session = await prisma.live_sessions.create({
      data: { class_arm_id: arm.id, room_id: generateRoomId() },
    });
    res.status(201).json(toLiveSession(session));
  } catch (err) {
    next(err);
  }
});

liveRouter.get("/live/rooms/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.live_sessions.findMany({ where: { room_id: req.params.roomId }, orderBy: { started_at: "desc" } });
    res.json({ sessions: sessions.map(toLiveSession) });
  } catch (err) {
    next(err);
  }
});

liveRouter.get("/live/sessions/:id", requireRoles("ADMIN", "TUTOR", "STUDENT"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.live_sessions.findUnique({ where: { id: req.params.id }, include: { class_arm: true } });
    if (!session) throw notFound("Session not found");
    const attendance = await prisma.live_attendance.findMany({ where: { session_id: session.id } });
    res.json({
      ...toLiveSession(session),
      armName: session.class_arm?.arm_name ?? null,
      attendanceCount: attendance.length,
    });
  } catch (err) {
    next(err);
  }
});

liveRouter.post("/live/sessions/:id/attendance", requireRoles("STUDENT", "TUTOR"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.live_sessions.findUnique({ where: { id: req.params.id } });
    if (!session || session.ended_at) throw notFound("Session not found");
    const existing = await prisma.live_attendance.findFirst({
      where: { session_id: session.id, user_id: req.user!.id },
    });
    const attendance = existing ?? (await prisma.live_attendance.create({ data: { session_id: session.id, user_id: req.user!.id } }));
    res.status(201).json({ sessionId: session.id, userId: attendance.user_id });
  } catch (err) {
    next(err);
  }
});

liveRouter.post("/parents/sneak_peek/sessions/:sessionId", requireRoles("PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({ durationSeconds: z.number().int().min(1).optional(), studentId: z.string().optional() }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const session = await prisma.live_sessions.findUnique({ where: { id: req.params.sessionId } });
    if (!session) throw notFound("Session not found");

    // Rate limit: max one sneak peek per parent per day (plan: "rate limits per parent").
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.parent_sneak_peek_logs.count({
      where: { parent_id: req.user!.id, accessed_at: { gte: today } },
    });
    if (todayCount >= 1) throw new AppError(429, "RATE_LIMITED", "Daily sneak-peek limit reached");

    const duration = Math.min(parsed.data.durationSeconds ?? 0, SNEAK_PEEK_MAX_SECONDS);
    if (duration < 1) throw badRequest("durationSeconds must be ≥ 1");

    const log = await prisma.parent_sneak_peek_logs.create({
      data: { parent_id: req.user!.id, session_id: session.id, duration_seconds: duration },
    });
    res.status(201).json(toSneakPeekLog(log));
  } catch (err) {
    next(err);
  }
});

liveRouter.get("/live/sessions/:id/attendance", requireRoles("TUTOR", "ADMIN", "STUDENT"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const attendance = await prisma.live_attendance.findMany({ where: { session_id: req.params.id } });
    res.json({ attendance: attendance.map((a) => ({ id: a.id, userId: a.user_id, joinedAt: a.joined_at.toISOString() })) });
  } catch (err) {
    next(err);
  }
});

export { prisma };
