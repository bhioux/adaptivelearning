import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserView } from "@al/shared";
import { prisma } from "../../db/prisma";
import { badRequest, conflict, notFound, unauthorized } from "../../errors/AppError";
import { logger } from "../../lib/logger";
import { setAuthCookies, clearAuthCookies, parseCookies, COOKIE_REFRESH_NAME } from "../../lib/cookies";
import { signAccessToken, createRefreshToken, hashRefreshToken } from "../../lib/tokens";
import { generateTotpSecret, generateTotpUri, verifyTotpCode } from "../../lib/totp";
import { rateLimit } from "../../lib/rateLimit";
import { sessionAuth, requireRoles, type AuthedRequest } from "../../middleware/auth";
import { logAudit } from "../../lib/audit";

export const usersRouter: Router = Router();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").max(255).email("Invalid email"),
  password: z.string().min(1, "Password is required").max(128),
});

const userUpsertSchema = z.object({
  email: z.string().trim().min(1, "Email is required").max(255).email("Invalid email"),
  password: z.string().min(1, "Password is required").max(128),
  role: z.enum(["STUDENT", "TUTOR", "PARENT", "ADMIN"]),
  displayName: z.string().trim().max(200).optional(),
});

const userUpdateSchema = z.object({
  email: z.string().trim().min(1).max(255).email("Invalid email").optional(),
  role: z.enum(["STUDENT", "TUTOR", "PARENT", "ADMIN"]).optional(),
  twoFactorEnabled: z.boolean().optional(),
  displayName: z.string().trim().max(200).optional(),
  resetPassword: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserRow = {
  id: string;
  email: string;
  role: string;
  created_at: Date;
  is_totp_enabled: boolean;
};

function serializeUser(u: UserRow): UserView {
  return {
    id: u.id,
    email: u.email,
    role: u.role as UserView["role"],
    twoFactorEnabled: Boolean(u.is_totp_enabled),
    displayName: null,
    avatar: null,
    createdAt: u.created_at.toISOString(),
  };
}

function issueTokens(user: { id: string; role: string; email: string }, res: Response): string {
  const { token: refreshToken, record } = createRefreshToken();
  void prisma.refresh_tokens
    .create({ data: { user_id: user.id, token_hash: record.tokenHash, expires_at: record.expiresAt } })
    .catch((err: unknown) => logger.error({ err }, "failed to store refresh token"));
  const accessToken = signAccessToken(user);
  setAuthCookies(res, accessToken, refreshToken);
  return accessToken;
}

// In-memory 2FA sessions (production: store in Redis/DB — Phase 2 hardening).
interface PendingTfaSession {
  userId: string;
  expiresAt: number;
}
const pendingTfaSessions = new Map<string, PendingTfaSession>();

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

usersRouter.post("/auth/login", rateLimit({ max: 10, windowMs: 5 * 60 * 1000 }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const { email } = parsed.data;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw unauthorized("Invalid credentials");
    const passwordOk = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!passwordOk) throw unauthorized("Invalid credentials");

    if (user.is_totp_enabled) {
      const sessionId = `tfa_${randomUUID()}`;
      const expiresAt = Date.now() + 5 * 60 * 1000;
      pendingTfaSessions.set(sessionId, { userId: user.id, expiresAt });
      return res.status(202).json({
        userId: user.id,
        tfaRequired: true,
        sessionId,
        message: "Enter your 2FA code via /auth/verify-2fa",
      });
    }

    const accessToken = issueTokens(user, res);
    res.json({ user: serializeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/auth/verify-2fa", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({ sessionId: z.string().min(1), code: z.string().min(1).max(10) }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body"));
    const session = pendingTfaSessions.get(parsed.data.sessionId);
    if (!session) throw unauthorized("Verification session expired or not found");
    if (session.expiresAt < Date.now()) {
      pendingTfaSessions.delete(parsed.data.sessionId);
      throw unauthorized("Verification session expired");
    }
    const user = await prisma.users.findUnique({ where: { id: session.userId } });
    if (!user || !user.totp_secret) throw unauthorized();
    const ok = verifyTotpCode(parsed.data.code, user.totp_secret);
    if (!ok) throw unauthorized("Invalid verification code");
    pendingTfaSessions.delete(parsed.data.sessionId);
    const accessToken = issueTokens(user, res);
    res.json({ user: serializeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
});

usersRouter.get("/auth/totp/setup", sessionAuth, requireRoles("STUDENT", "TUTOR", "PARENT", "ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const secret = generateTotpSecret(20);
    const user = await prisma.users.update({ where: { id: userId }, data: { totp_secret: secret } });
    return res.json({ secret, uri: generateTotpUri(secret, user.email) });
    void generateTotpSecret;
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/auth/totp/enable", sessionAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = z.object({ code: z.string().min(1).max(10) }).safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body"));
    const userId = req.user!.id;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user?.totp_secret) throw badRequest("Call /auth/totp/setup first");
    if (!verifyTotpCode(parsed.data.code, user.totp_secret)) throw unauthorized("Invalid verification code");
    const updated = await prisma.users.update({ where: { id: userId }, data: { is_totp_enabled: true } });
    await logAudit(req, "totp.enable", "user", userId, { userEmail: user.email });
    return res.json({ ok: true, twoFactorEnabled: updated.is_totp_enabled });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/auth/totp/disable", sessionAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await prisma.users.update({ where: { id: userId }, data: { is_totp_enabled: false, totp_secret: null } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/auth/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const bodyToken = typeof req.body === "object" && req.body !== null && "refreshToken" in req.body
      ? (req.body as { refreshToken?: string }).refreshToken
      : undefined;
    const token = cookies[COOKIE_REFRESH_NAME] ?? (typeof bodyToken === "string" ? bodyToken : undefined);
    if (!token) throw badRequest("Refresh token required");
    const row = await prisma.refresh_tokens.findUnique({ where: { token_hash: hashRefreshToken(token) } });
    if (!row) throw unauthorized();
    const user = await prisma.users.findUnique({ where: { id: row.user_id } });
    if (!user) throw unauthorized();
    await prisma.refresh_tokens.delete({ where: { id: row.id } });
    const { token: newRefreshToken, record } = createRefreshToken();
    await prisma.refresh_tokens.create({ data: { user_id: user.id, token_hash: record.tokenHash, expires_at: record.expiresAt } });
    const accessToken = signAccessToken(user);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ user: serializeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/auth/logout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_REFRESH_NAME];
    if (token) {
      const row = await prisma.refresh_tokens.findUnique({ where: { token_hash: hashRefreshToken(token) } });
      if (row) await prisma.refresh_tokens.delete({ where: { id: row.id } });
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

usersRouter.get("/auth/me", sessionAuth, (_req: AuthedRequest, res: Response) => {
  const user = _req.user!;
  res.json({ id: user.id, email: user.email, role: user.role });
});

// ---------------------------------------------------------------------------
// Admin user management
// ---------------------------------------------------------------------------

usersRouter.get("/users", sessionAuth, requireRoles("ADMIN"), async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { created_at: "desc" },
      select: { id: true, email: true, role: true, is_totp_enabled: true, created_at: true },
    });
    res.json({ users: users.map(serializeUser) });
  } catch (err) {
    next(err);
  }
});

usersRouter.get("/users/:id", sessionAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) throw notFound("User not found");
    if (req.user!.role !== "ADMIN" && req.user!.id !== user.id) throw notFound("User not found");
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/users", sessionAuth, requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = userUpsertSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const { email, password, role } = parsed.data;
    const exists = await prisma.users.findUnique({ where: { email } });
    if (exists) throw conflict(`User with email ${email} already exists`);
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: await bcrypt.hash(password, 12),
        role,
        is_totp_enabled: false,
      },
    });
    await logAudit(req, "user.create", "user", user.id, { userEmail: email, role });
    res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

usersRouter.put("/users/:id", sessionAuth, requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(badRequest("Invalid request body", parsed.error.issues));
    const id = req.params.id;
    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing) throw notFound("User not found");
    if (parsed.data.resetPassword) {
      const raw = await generateTempPassword();
      await prisma.users.update({ where: { id }, data: { password_hash: await bcrypt.hash(raw, 12) } });
      await logAudit(req, "user.password_reset", "user", id, { userEmail: existing.email });
      return res.json({ user: serializeUser(existing), temporaryPassword: raw });
    }
    const data: Record<string, unknown> = {};
    if (parsed.data.email) data.email = parsed.data.email;
    if (parsed.data.role) data.role = parsed.data.role;
    if (parsed.data.displayName !== undefined) data.display_name = parsed.data.displayName;
    if (parsed.data.twoFactorEnabled !== undefined) data.is_totp_enabled = parsed.data.twoFactorEnabled;
    const user = await prisma.users.update({ where: { id }, data: data as never });
    await logAudit(req, "user.update", "user", id, { email: user.email, role: user.role });
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

async function generateTempPassword(): Promise<string> {
  // Simple, local — not a production passphrase generator.
  const raw = `Temp${Math.random().toString(36).slice(2, 10)}!`;
  return raw;
}

usersRouter.delete("/users/:id", sessionAuth, requireRoles("ADMIN"), async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    await prisma.refresh_tokens.deleteMany({ where: { user_id: id } });
    await prisma.users.delete({ where: { id } });
    await logAudit(req, "user.delete", "user", id);
    res.status(204).send("");
  } catch (err) {
    next(err);
  }
});

export { prisma };
