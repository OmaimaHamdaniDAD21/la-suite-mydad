import { prisma } from "@mydad/database";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "CONFIG_CHANGE"
  | "DATA_SYNC"
  | "AGENT_RUN"
  | "EXPORT"
  | "INVITE";

interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        ...(entry.userId ? { user: { connect: { id: entry.userId } } } : {}),
        ...(entry.organizationId
          ? { organization: { connect: { id: entry.organizationId } } }
          : {}),
      },
    });
  } catch {
    // Don't let audit logging failures break the app
  }
}
