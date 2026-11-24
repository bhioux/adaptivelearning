import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { AppError, notFound, badRequest } from "../../errors/AppError";
import { prisma } from "../../db/prisma";
import { requireRoles, type AuthedRequest } from "../../middleware/auth";
type ClassModel = NonNullable<Awaited<ReturnType<typeof prisma.classes.findFirst>>>;
type ClassArmModel = NonNullable<Awaited<ReturnType<typeof prisma.class_arms.findFirst>>>;

export const classesRouter: Router = Router();

// --- response serializers ---

const armToResponse = (a: ClassArmModel) => ({
  id: a.id,
  classId: a.class_id,
  armName: a.arm_name,
  assignedTutorId: a.assigned_tutor_id,
  config: a.config ?? {},
  createdAt: a.created_at.toISOString(),
});

const classToResponse = (c: ClassModel) => ({
  id: c.id,
  name: c.name,
  code: c.code,
  description: c.description,
  level: c.level,
  isPublished: c.is_published,
  createdAt: c.created_at.toISOString(),
  updatedAt: c.updated_at.toISOString(),
});

// --- schemas ---

const classSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(100),
  code: z.string().trim().min(1, "Class code is required").max(50),
  description: z.string().trim().max(500).optional(),
  level: z.string().trim().max(50).optional(),
  isPublished: z.boolean().optional(),
});

const armSchema = z.object({
  armName: z.string().trim().min(1, "Arm name is required").max(50),
  assignedTutorId: z.string().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// --- routes ---

classesRouter.get("/classes", requireRoles("ADMIN", "TUTOR", "STUDENT"), async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.classes.findMany({ include: { class_arms: { orderBy: { arm_name: "asc" } } }, orderBy: { name: "asc" } });
    res.json({ classes: classes.map((c) => ({ ...classToResponse(c), class_arms: c.class_arms.map(armToResponse) })) });
  } catch (err) {
    next(err);
  }
});

classesRouter.post("/classes", requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = classSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const data = parsed.data;
    const existing = await prisma.classes.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError(409, "CONFLICT", `Class code '${data.code}' is already used`);
    const cls = await prisma.classes.create({
      data: { name: data.name, code: data.code, description: data.description ?? "", level: data.level ?? "", is_published: data.isPublished ?? false },
    });
    await logAuditFromReq(req, "class.create", "class", cls.id, { name: cls.name });
    res.status(201).json(classToResponse(cls));
  } catch (err) {
    next(err);
  }
});

classesRouter.get("/classes/:id/arms", requireRoles("ADMIN", "TUTOR"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const arms = await prisma.class_arms.findMany({ where: { class_id: req.params.id }, orderBy: { arm_name: "asc" } });
    res.json({ arms: arms.map(armToResponse) });
  } catch (err) {
    next(err);
  }
});

classesRouter.post("/classes/:id/arms", requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = armSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const cls = await prisma.classes.findUnique({ where: { id: req.params.id } });
    if (!cls) throw notFound("Class not found");
    const arm = await prisma.class_arms.create({
      data: { class_id: cls.id, arm_name: parsed.data.armName, assigned_tutor_id: parsed.data.assignedTutorId ?? null, config: (parsed.data.config ?? {}) as never },
    });
    res.status(201).json(armToResponse(arm));
  } catch (err) {
    next(err);
  }
});

classesRouter.put("/class_arms/:id", requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = armSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const arm = await prisma.class_arms.findUnique({ where: { id: req.params.id } });
    if (!arm) throw notFound("Class arm not found");
    const data: Record<string, unknown> = {};
    if (parsed.data.armName) data.arm_name = parsed.data.armName;
    if (parsed.data.assignedTutorId !== undefined) data.assigned_tutor_id = parsed.data.assignedTutorId || null;
    if (parsed.data.config) data.config = parsed.data.config;
    const updated = await prisma.class_arms.update({ where: { id: arm.id }, data: data as never });
    res.json(armToResponse(updated));
  } catch (err) {
    next(err);
  }
});

classesRouter.delete("/class_arms/:id", requireRoles("ADMIN"), async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  try {
    await prisma.class_arms.delete({ where: { id: req.params.id } });
    _res.status(204).send("");
  } catch (err) {
    next(err);
  }
});

import { logAudit as logAuditFromReq } from "../../lib/audit";
export { prisma };
export type { Role } from "@al/shared";
