import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { requireRoles, type AuthedRequest } from "../../middleware/auth";
import { badRequest } from "../../errors/AppError";

export const socialRouter: Router = Router();

// In-memory fallback catalog until the RSS aggregator (Phase 4) ships.
const FALLBACK_ITEMS: Array<{
  id: string;
  source: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  topics: string[];
}> = [
  {
    id: "news-1",
    source: "MIT News",
    title: "New adaptive evaluation framework released",
    description: "A lightweight framework that calibrates item difficulty per learner cohort and emits xAPI statements.",
    url: "https://news.mit.edu/adaptive-evaluation-framework",
    publishedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    topics: ["Science"],
  },
  {
    id: "news-2",
    source: "Hacker News",
    title: "Local meetup: Adaptive learning meetup",
    description: "Community meetup about AI-assisted tutoring with a guest talk from our team.",
    url: "https://news.ycombinator.com/adaptive-learning-meetup",
    publishedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    topics: ["Community"],
  },
  {
    id: "news-3",
    source: "Physics Today",
    title: "Designing assessments for measurable learning outcomes",
    description: "Key principles for building assessments that drive measurable learning outcomes.",
    url: "https://physics.today/designing-assessments",
    publishedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    topics: ["Education", "Teaching"],
  },
];

type SocialFeedPrefsRecord = {
  id: string;
  user_id: string;
  topics: unknown;
  muted_sources: unknown;
  created_at: Date;
  updated_at: Date;
};

const toPrefsResponse = (p: SocialFeedPrefsRecord) => ({
  id: p.id,
  userId: p.user_id,
  topics: Array.isArray(p.topics) ? p.topics : [],
  mutedSources: Array.isArray(p.muted_sources) ? p.muted_sources : [],
  createdAt: p.created_at.toISOString(),
  updatedAt: p.updated_at.toISOString(),
});

socialRouter.get("/feed", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const prefs = await prisma.social_feed_prefs.findUnique({ where: { user_id: req.user!.id } });
    const topics = prefs?.topics as string[] | undefined;
    const muted = (prefs?.muted_sources as string[] | undefined) ?? [];
    let items = FALLBACK_ITEMS;
    if (topics && topics.length > 0) {
      const wanted = new Set(topics);
      items = items.filter((item) => item.topics.some((t) => wanted.has(t)));
    }
    const itemsOut = items
      .filter((item) => !muted.includes(item.source))
      .slice(0, 20)
      .map((item) => ({ ...item, muted: false, tags: item.topics }));
    res.json({ items: itemsOut, prefs: prefs ? toPrefsResponse(prefs) : null });
  } catch (err) {
    next(err);
  }
});

const prefsSchema = z.object({
  topics: z.array(z.string()).optional(),
  mutedSources: z.array(z.string()).optional(),
});

socialRouter.put("/feed/prefs", requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = prefsSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const data: Record<string, unknown> = {};
    if (parsed.data.topics) data.topics = parsed.data.topics;
    if (parsed.data.mutedSources) data.muted_sources = parsed.data.mutedSources;
    const prefs = await prisma.social_feed_prefs.upsert({
      where: { user_id: req.user!.id },
      update: data as never,
      create: { user_id: req.user!.id, topics: parsed.data.topics ?? [], muted_sources: parsed.data.mutedSources ?? [] },
    });
    res.json(toPrefsResponse(prefs));
  } catch (err) {
    next(err);
  }
});

export { prisma };
