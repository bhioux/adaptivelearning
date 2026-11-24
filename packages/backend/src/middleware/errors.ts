import type { ErrorRequestHandler } from "express";
import { logger } from "../lib/logger";
import { toErrorPayload } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const { status, body } = toErrorPayload(err);
  if (status >= 500) {
    logger.error({ err, url: req.url, method: req.method, status }, "Request failed");
  } else {
    logger.warn({ url: req.url, method: req.method, status, code: body.error.code }, "Request rejected");
  }
  res.status(status).json(body);
};
