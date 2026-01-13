import { Injectable } from "@nestjs/common";
import type { AuditAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private toJson(value?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
    if (value == null) return undefined;
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private diff(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null) {
    if (!before && !after) return {};
    if (!before || !after) return { before, after };
    const beforeDiff: Record<string, unknown> = {};
    const afterDiff: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    keys.forEach((key) => {
      const b = before[key];
      const a = after[key];
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        beforeDiff[key] = b;
        afterDiff[key] = a;
      }
    });
    return { before: beforeDiff, after: afterDiff };
  }

  async record(params: {
    orgId: string;
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    caseId?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    reason?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const diff = this.diff(params.before, params.after);
    return this.prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        caseId: params.caseId,
        before: this.toJson(diff.before ?? null),
        after: this.toJson(diff.after ?? null),
        reason: params.reason ?? undefined,
        ip: params.ip ?? undefined,
        userAgent: params.userAgent ?? undefined
      }
    });
  }
}
