import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { rateLimited } from "../errors/AppError";

interface Hit {
  at: number;
}

const HITS = new Map<string, Hit[]>();

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
}

export function rateLimit(options: RateLimitOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method} ${req.ip ?? "unknown"} ${req.path}`;
    const now = Date.now();
    const bucket = (HITS.get(key) ?? []).filter((h) => now - h.at < windowMs);
    if (bucket.length >= max) {
      const oldest = bucket[0]!;
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((windowMs - (now - oldest.at)) / 1000))));
      return next(rateLimited("Too many requests. Retry shortly."));
    }
    bucket.push({ at: now });
    HITS.set(key, bucket);
    if (HITS.size > 5000) {
      for (const [k, v] of HITS) {
        if (v.length === 0) HITS.delete(k);
      }
    }
    next();
  };
}

export default rateLimit;
