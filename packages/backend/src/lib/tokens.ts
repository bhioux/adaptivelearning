import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenRecord {
  tokenHash: string;
  expiresAt: Date;
}

export const accessTokenVersion = "alat-v1";

export function signAccessToken(user: { id: string; email: string; role: string }): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      iat: now,
      iss: "adaptivelearning",
      aud: "adaptivelearning",
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`, jwtid: randomUUID() },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: "adaptivelearning",
      audience: "adaptivelearning",
      clockTolerance: 0,
    }) as AccessTokenPayload;
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createRefreshToken(): { token: string; record: RefreshTokenRecord } {
  const token = randomBytes(32).toString("hex");
  const record: RefreshTokenRecord = {
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  };
  return { token, record };
}

export function generateTwoFactorSessionId(): string {
  return `tfa_${randomUUID()}`;
}

export function generateTwoFactorSessionSecret(): string {
  // Secret stored server-side until user registers; TOTP code checked in lib/totp.
  return randomBytes(16).toString("hex");
}
