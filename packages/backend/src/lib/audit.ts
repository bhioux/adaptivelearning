import { prisma } from "../db/prisma";
import { logger } from "./logger";
import type { AuthedRequest } from "../middleware/auth";
import type { JsonValue } from "@al/shared";

/**
 * Append a row to the audit_logs table (admin/operator trail). Never throws —
 * audit logging is best-effort so it can't break request flows.
 */
export async function logAudit(
  req: AuthedRequest,
  action: string,
  entity: string,
  entityId: string,
  metadata: Record<string, JsonValue> = {},
): Promise<void> {
  const userId = req.user?.id;
  let userEmail: string | null = null;
  if (userId) {
    userEmail = (await prisma.users.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? null;
  }
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        user_email: userEmail,
        action,
        entity,
        entity_id: entityId,
        metadata: metadata as never,
        ip_address: req.ip ?? null,
      },
    });
  } catch (err) {
    logger.warn({ err }, "audit log write failed");
  }
}
