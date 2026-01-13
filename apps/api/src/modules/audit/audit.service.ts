import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private toJson(value?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
    if (value == null) return undefined;
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

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
        before: this.toJson(params.before),
        after: this.toJson(params.after),
        reason: params.reason ?? undefined
      }
    });
  }
}
