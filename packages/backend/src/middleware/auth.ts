import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../lib/tokens";
import { parseCookies, COOKIE_ACCESS_NAME } from "../lib/cookies";
import { unauthorized, AppError } from "../errors/AppError";

export interface AuthedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthedRequest extends Request {
  user?: AuthedUser;
  /** Current user's JWT payload, when available (e.g., public reads). */
  accessToken?: string;
}

export async function sessionAuth(req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) token = header.slice(7).trim();
    if (!token) {
      token = parseCookies(req.headers.cookie)[COOKIE_ACCESS_NAME];
    }
    if (!token) throw unauthorized();
    const payload = verifyAccessToken(token);
    if (!payload) throw unauthorized();
    const user = await prisma.users.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized();
    req.user = { id: user.id, email: user.email, role: user.role };
    req.accessToken = token;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : unauthorized());
  }
}

export function requireRoles(...roles: string[]): (req: AuthedRequest, _res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    const user = req.user;
    if (!user) return next(unauthorized());
    if (!roles.includes(user.role)) return next(new AppError(403, "FORBIDDEN", `Role '${user.role}' is not allowed here`));
    next();
  };
}
