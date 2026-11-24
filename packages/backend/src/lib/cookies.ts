import type { Response } from "express";
import { env } from "../config/env";

export const COOKIE_ACCESS_NAME = "al_access_token";
export const COOKIE_REFRESH_NAME = "al_refresh_token";

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const secure = env.NODE_ENV !== "development";
  const secureFlag = secure ? "; Secure" : "";
  res.append("Set-Cookie", `${COOKIE_ACCESS_NAME}=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${env.ACCESS_TOKEN_TTL_MINUTES * 60}${secureFlag}`);
  res.append("Set-Cookie", `${COOKIE_REFRESH_NAME}=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${env.REFRESH_TOKEN_TTL_DAYS * 86400}${secureFlag}`);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_ACCESS_NAME, { path: "/" });
  res.clearCookie(COOKIE_REFRESH_NAME, { path: "/" });
}
