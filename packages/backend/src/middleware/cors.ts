import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

const ORIGINS = new Set(env.CORS_ORIGIN.map((o) => o.trim()).filter(Boolean));

/**
 * Same-origin browser + mobile app origins get cookies; other origins only
 * get the allow-origin header (no credentials). Prod origins must be
 * configured via CORS_ORIGIN.
 */
export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
  const isSameOrigin = !origin || ORIGINS.has(origin);
  if (origin && isSameOrigin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-Trace-Id",
  );
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.status(204).send("");
    return;
  }
  if (isSameOrigin) res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
}
