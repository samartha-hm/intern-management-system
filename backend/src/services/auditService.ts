import prisma from '../lib/prismaClient';

export interface AuditLogOptions {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}

export const logAuditAction = async (options: AuditLogOptions): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        details: options.details,
        ipAddress: options.ipAddress,
      },
    });
  } catch (error) {
    // Non-blocking error logger for audit log failures
    console.error('[AUDIT LOG ERROR]', error);
  }
};
