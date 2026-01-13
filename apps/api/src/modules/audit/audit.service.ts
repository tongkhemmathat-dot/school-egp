import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    orgId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    caseId?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    reason?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        caseId: params.caseId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        reason: params.reason ?? undefined
      }
    });
  }
}
