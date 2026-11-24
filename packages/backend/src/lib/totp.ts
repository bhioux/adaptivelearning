import { authenticator } from "otplib";

/**
 * Helpers for TOTP 2FA via otplib (RFC 6238). Secrets are stored base32.
 */

export function generateTotpSecret(length = 20): string {
  const gen = authenticator as unknown as {
    generateSecret?: (opts?: { length?: number }) => string;
  };
  if (typeof gen.generateSecret === "function") {
    return gen.generateSecret({ length });
  }
  return authenticator.generateSecret();
}

export function generateTotpUri(secret: string, accountName: string, issuer = "Adaptive Learning Platform"): string {
  // RFC 6238 otpauth URI — the standard QR string for TOTP apps.
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({ issuer, secret, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
