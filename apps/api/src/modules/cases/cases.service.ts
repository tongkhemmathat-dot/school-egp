import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(orgId: string) {
    return this.prisma.procurementCase.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } });
  }

  async create(orgId: string, userId: string, data: { title: string; caseType: string; isBackdated?: boolean }) {
    const created = await this.prisma.procurementCase.create({
      data: {
        orgId,
        title: data.title,
        caseType: data.caseType,
        isBackdated: data.isBackdated ?? false
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "create",
      entity: "case",
      entityId: created.id,
      caseId: created.id,
      after: created
    });
    return created;
  }

  async update(orgId: string, userId: string, id: string, data: { title?: string; status?: string }) {
    const before = await this.prisma.procurementCase.findUnique({ where: { id } });
    if (!before || before.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    const updated = await this.prisma.procurementCase.update({
      where: { id },
      data
    });
    await this.audit.record({
      orgId,
      userId,
      action: "update",
      entity: "case",
      entityId: id,
      caseId: id,
      before,
      after: updated
    });
    return updated;
  }

  async get(orgId: string, id: string) {
    const found = await this.prisma.procurementCase.findUnique({
      where: { id },
      include: { documents: true, auditLogs: true }
    });
    if (!found || found.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    return found;
  }
}
