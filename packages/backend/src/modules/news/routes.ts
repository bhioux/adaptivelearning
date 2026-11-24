import { Router, type Request, type Response, type NextFunction } from "express";
import { logger } from "../../lib/logger";

export const newsRouter: Router = Router();

// RSS aggregator. Phase 4: real fetcher with dedupe, preference-based curation,
// safe-content filtering and the moderation queue. Fallback returns in-memory
// demo items until then.

newsRouter.post("/news/ingest", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("news/ingest called — RSS fetcher not wired yet (stub)");
    res.json({ ingested: 0, note: "RSS aggregator not implemented yet (Phase 4)" });
  } catch (err) {
    next(err);
  }
});

newsRouter.get("/news", async (_req: Request, res: Response) => {
  res.json({
    items: [],
    note: "RSS aggregator not implemented yet (Phase 4)",
  });
});

