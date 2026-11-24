import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { badRequest, forbidden, notFound } from "../../errors/AppError";
import { prisma } from "../../db/prisma";
import { requireRoles, type AuthedRequest } from "../../middleware/auth";

export const coursesRouter: Router = Router();

const courseOut = (c: { id: string; title: string; slug: string; description: string; level: string; is_published: boolean; created_at: Date; updated_at: Date }) => ({
  id: c.id,
  title: c.title,
  slug: c.slug,
  description: c.description,
  level: c.level,
  isPublished: c.is_published,
  createdAt: c.created_at.toISOString(),
  updatedAt: c.updated_at.toISOString(),
});

const lessonOut = (l: { id: string; module_id: string; title: string; order: number; content: unknown; duration_seconds: number | null; created_at: Date; updated_at: Date }) => ({
  id: l.id,
  moduleId: l.module_id,
  title: l.title,
  order: l.order,
  content: l.content,
  durationSeconds: l.duration_seconds,
  createdAt: l.created_at.toISOString(),
  updatedAt: l.updated_at.toISOString(),
});

const moduleOut = (m: { id: string; course_id: string; title: string; order: number; content_url: string | null; video_url: string | null; created_at: Date; updated_at: Date }) => ({
  id: m.id,
  courseId: m.course_id,
  title: m.title,
  order: m.order,
  contentUrl: m.content_url,
  videoUrl: m.video_url,
  createdAt: m.created_at.toISOString(),
  updatedAt: m.updated_at.toISOString(),
});

const assessmentOut = (a: { id: string; lesson_id: string; type: string; config: unknown; max_score: number | null; created_at: Date; updated_at: Date }) => ({
  id: a.id,
  lessonId: a.lesson_id,
  type: a.type,
  config: a.config,
  maxScore: a.max_score,
  createdAt: a.created_at.toISOString(),
  updatedAt: a.updated_at.toISOString(),
});

// --- Routes ---

coursesRouter.get("/courses", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const where = req.user?.role === "ADMIN" || req.user?.role === "TUTOR" ? {} : { is_published: true };
    const courses = await prisma.courses.findMany({ where: where as never, include: { modules: true }, orderBy: { created_at: "desc" } });
    res.json({ courses: courses.map((c) => ({ ...courseOut(c), modules: c.modules.map(moduleOut) })) });
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/courses", requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({
      title: z.string().trim().min(1).max(200),
      slug: z.string().trim().min(1).max(100),
      description: z.string().trim().max(2000).optional(),
      level: z.string().trim().max(100).optional(),
      parentCourseId: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const course = await prisma.courses.create({
      data: { title: parsed.data.title, slug: parsed.data.slug, description: parsed.data.description ?? "", level: parsed.data.level ?? "", parent_course_id: parsed.data.parentCourseId ?? null, is_published: false },
    });
    res.status(201).json(courseOut(course));
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/courses/:id", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.courses.findUnique({ where: { id: req.params.id }, include: { modules: { orderBy: { order: "asc" } } } });
    if (!course) throw notFound("Course not found");
    if (req.user?.role !== "ADMIN" && req.user?.role !== "TUTOR" && !course.is_published) throw notFound("Course not found");
    res.json({ ...courseOut(course), modules: course.modules.map(moduleOut) });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/courses/:id/modules", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.courses.findUnique({ where: { id: req.params.id } });
    if (!course) throw notFound("Course not found");
    const modules = await prisma.modules.findMany({ where: { course_id: course.id }, orderBy: { order: "asc" } });
    const out = [];
    for (const m of modules) {
      const lessons = await prisma.lessons.findMany({ where: { module_id: m.id }, orderBy: { order: "asc" } });
      out.push({ ...moduleOut(m), lessons: lessons.map(lessonOut) });
    }
    res.json({ courseId: course.id, modules: out });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/courses/:courseId/lessons", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.courses.findUnique({ where: { id: req.params.courseId } });
    if (!course) throw notFound("Course not found");
    const modules = await prisma.modules.findMany({ where: { course_id: course.id } });
    const lessons = await prisma.lessons.findMany({ where: { module_id: { in: modules.map((m) => m.id) } }, orderBy: { order: "asc" } });
    res.json({ lessons: lessons.map(lessonOut) });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/lessons/:id", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const lesson = await prisma.lessons.findUnique({ where: { id: req.params.id } });
    if (!lesson) throw notFound("Lesson not found");
    const assessments = await prisma.assessments.findMany({ where: { lesson_id: lesson.id } });
    const items = await prisma.items.findMany({ where: { assessment_id: { in: assessments.map((a) => a.id) } }, orderBy: { difficulty: "asc" } });
    res.json({
      ...lessonOut(lesson),
      assessments: assessments.map((a) => ({ ...assessmentOut(a) })),
      items: items.map((i) => ({
        id: i.id,
        question: i.question,
        options: i.options,
        correctAnswer: i.correct_answer,
        points: i.points,
        difficulty: i.difficulty,
        explanation: i.explanation,
      })),
    });
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/lessons", requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({
      moduleId: z.string(),
      title: z.string().trim().min(1).max(200),
      order: z.number().int().min(0),
      durationSeconds: z.number().int().min(0).optional(),
      content: z.unknown().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const lesson = await prisma.lessons.create({
      data: { module_id: parsed.data.moduleId, title: parsed.data.title, order: parsed.data.order, content: parsed.data.content as never, duration_seconds: parsed.data.durationSeconds ?? null },
    });
    res.status(201).json(lessonOut(lesson));
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/assessments", requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({
      lessonId: z.string(),
      type: z.enum(["quiz", "assessment", "assignment"]),
      config: z.record(z.string(), z.unknown()),
      maxScore: z.number().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const assessment = await prisma.assessments.create({
      data: { lesson_id: parsed.data.lessonId, type: parsed.data.type, config: parsed.data.config as never, max_score: parsed.data.maxScore ?? null },
    });
    res.status(201).json(assessmentOut(assessment));
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/progress", requireRoles("STUDENT", "TUTOR"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({
      lessonId: z.string().min(1),
      answers: z.unknown(),
      intendedDifficulty: z.number().int().min(0).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const userId = req.user!.id;
    const lesson = await prisma.lessons.findUnique({ where: { id: parsed.data.lessonId } });
    if (!lesson) throw notFound("Lesson not found");
    if (req.user!.role !== "STUDENT") throw forbidden("Only students may submit answers");
    let submission = await prisma.submissions.findFirst({ where: { lesson_id: lesson.id, student_id: userId } });
    if (submission) {
      submission = await prisma.submissions.update({
        where: { id: submission.id },
        data: { answers: parsed.data.answers as never, difficulty_intended: parsed.data.intendedDifficulty ?? null },
      });
    } else {
      submission = await prisma.submissions.create({
        data: {
          lesson_id: lesson.id,
          student_id: userId,
          answers: parsed.data.answers as never,
          status: "PENDING",
          difficulty_intended: parsed.data.intendedDifficulty ?? null,
        },
      });
    }
    res.status(201).json({ id: submission.id, lessonId: submission.lesson_id, status: submission.status });
  } catch (err) {
    next(err);
  }
});

coursesRouter.get("/progress", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const submissions = await prisma.submissions.findMany({ where: { student_id: userId }, orderBy: { submitted_at: "desc" }, take: 50 });
    res.json({
      progress: submissions.map((s) => ({
        submissionId: s.id,
        lessonId: s.lesson_id,
        score: s.score,
        status: s.status,
        submittedAt: s.submitted_at ? s.submitted_at.toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export { prisma };
