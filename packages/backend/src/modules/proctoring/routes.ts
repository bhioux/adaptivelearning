import { Router, type Request, type Response } from "express";
import { requireRoles } from "../../middleware/auth";

export const proctoringRouter: Router = Router();

// Placeholder for the Python AI sidecar (FastAPI) — Phase 4 (proctoring: gaze,
// tab-switch lock, integrity scoring, incident review).
proctoringRouter.post("/proctoring/sessions", requireRoles("STUDENT", "TUTOR"), async (_req: Request, res: Response) => {
  res.status(501).json({ code: "NOT_IMPLEMENTED", message: "AI proctoring sidecar not wired (Phase 4)" });
});

proctoringRouter.get("/proctoring/scores/:sessionId", requireRoles("TUTOR", "ADMIN"), async (req: Request, res: Response) => {
  res.status(501).json({ code: "NOT_IMPLEMENTED", message: "AI proctoring sidecar not wired (Phase 4)" });
});

export { prisma } from "../../db/prisma";
