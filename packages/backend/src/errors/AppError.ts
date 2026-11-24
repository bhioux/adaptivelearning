/**
 * Domain errors. All thrown errors must extend AppError so the global
 * error handler can map them to HTTP responses with a JSON body:
 * { "error": { "code": string, "message": string, "details"?: unknown } }
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message?: string): AppError =>
  new AppError(401, "UNAUTHORIZED", message ?? "Authentication required");
export const forbidden = (message?: string): AppError =>
  new AppError(403, "FORBIDDEN", message ?? "Insufficient permissions");
export const notFound = (resource?: string): AppError =>
  new AppError(404, "NOT_FOUND", resource ?? "Resource not found");
export const conflict = (message: string, details?: unknown): AppError =>
  new AppError(409, "CONFLICT", message, details);
export const unprocessable = (message: string, details?: unknown): AppError =>
  new AppError(422, "UNPROCESSABLE_ENTITY", message, details);
export const rateLimited = (message?: string): AppError =>
  new AppError(429, "RATE_LIMITED", message ?? "Too many requests");
export const internal = (message = "Internal server error", details?: unknown): AppError =>
  new AppError(500, "INTERNAL_ERROR", message, details);

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toErrorPayload(err: unknown): { status: number; body: { error: { code: string; message: string; details?: unknown } } } {
  if (isAppError(err)) {
    return {
      status: err.statusCode,
      body: { error: { code: err.code, message: err.message, details: err.details } },
    };
  }
  const e = err as Error | undefined;
  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: e?.message ?? "Internal server error", details: undefined } },
  };
}

/** Serialize user-facing profile. Keeps PII shape identical across the app. */
export interface PublicUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}
