import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { ApprovalAction, CaseStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(
    orgId: string,
    filters?: { status?: CaseStatus; caseType?: string; vendorId?: string; fiscalYear?: number }
  ) {
    return this.prisma.procurementCase.findMany({
      where: {
        orgId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.caseType ? { caseType: filters.caseType as any } : {}),
        ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
        ...(filters?.fiscalYear ? { fiscalYear: filters.fiscalYear } : {})
      },
      orderBy: { createdAt: "desc" },
      include: { vendor: true }
    });
  }

  async create(
    orgId: string,
    userId: string,
    data: {
      title: string;
      reason?: string | null;
      caseType: string;
      subtype?: string | null;
      budgetAmount: number;
      fiscalYear: number;
      desiredDate?: string | null;
      vendorId?: string | null;
      isBackdated: boolean;
      backdateReason?: string | null;
      lunchMeta?: Record<string, string>;
      lines: { description: string; itemId?: string | null; quantity: number; unitPrice: number }[];
    },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    if (data.isBackdated && !data.backdateReason) {
      throw new BadRequestException("Backdate reason is required");
    }
    if ((data.caseType === "LUNCH" || data.caseType === "INTERNET") && !data.subtype) {
      throw new BadRequestException("Subtype is required");
    }
    const created = await this.prisma.$transaction(async (tx) => {
      const header = await tx.procurementCase.create({
        data: {
          orgId,
          title: data.title,
          reason: data.reason ?? null,
          caseType: data.caseType as any,
          subtype: (data.subtype || null) as any,
          budgetAmount: data.budgetAmount,
          fiscalYear: data.fiscalYear,
          desiredDate: data.desiredDate ? new Date(data.desiredDate) : null,
          vendorId: data.vendorId ?? null,
          isBackdated: data.isBackdated,
          backdateReason: data.backdateReason ?? null,
          lunchMeta: data.lunchMeta ?? undefined,
          createdById: userId
        }
      });
      if (data.lines.length > 0) {
        await tx.caseLine.createMany({
          data: data.lines.map((line) => ({
            orgId,
            caseId: header.id,
            description: line.description,
            itemId: line.itemId ?? null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.quantity * line.unitPrice
          }))
        });
      }
      return header;
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "case",
      entityId: created.id,
      caseId: created.id,
      after: created,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return created;
  }

  async update(
    orgId: string,
    userId: string,
    id: string,
    data: {
      title?: string;
      reason?: string | null;
      status?: CaseStatus;
      budgetAmount?: number;
      desiredDate?: string | null;
      vendorId?: string | null;
      isBackdated?: boolean;
      backdateReason?: string | null;
      lunchMeta?: Record<string, string>;
    },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.procurementCase.findUnique({ where: { id } });
    if (!before || before.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    if (data.isBackdated && !data.backdateReason) {
      throw new BadRequestException("Backdate reason is required");
    }
    const updated = await this.prisma.procurementCase.update({
      where: { id },
      data: {
        ...data,
        lunchMeta: data.lunchMeta ?? undefined,
        desiredDate: data.desiredDate ? new Date(data.desiredDate) : undefined
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "case",
      entityId: id,
      caseId: id,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async get(orgId: string, id: string) {
    const found = await this.prisma.procurementCase.findUnique({
      where: { id },
      include: {
        documents: true,
        auditLogs: true,
        lines: true,
        approvals: true,
        vendor: true
      }
    });
    if (!found || found.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    return found;
  }

  async updateLines(
    orgId: string,
    userId: string,
    id: string,
    lines: { description: string; itemId?: string | null; quantity: number; unitPrice: number }[],
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const existing = await this.prisma.procurementCase.findUnique({ where: { id } });
    if (!existing || existing.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.caseLine.deleteMany({ where: { caseId: id } });
      if (lines.length > 0) {
        await tx.caseLine.createMany({
          data: lines.map((line) => ({
            orgId,
            caseId: id,
            description: line.description,
            itemId: line.itemId ?? null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.quantity * line.unitPrice
          }))
        });
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "case-lines",
      entityId: id,
      caseId: id,
      after: { count: lines.length },
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async delete(orgId: string, userId: string, id: string, meta?: { ip?: string | null; userAgent?: string | null }) {
    const before = await this.prisma.procurementCase.findUnique({ where: { id } });
    if (!before || before.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    await this.prisma.procurementCase.delete({ where: { id } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "case",
      entityId: id,
      caseId: id,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async recordApproval(
    orgId: string,
    userId: string,
    id: string,
    action: ApprovalAction,
    comment?: string | null,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const found = await this.prisma.procurementCase.findUnique({ where: { id } });
    if (!found || found.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    const statusMap: Record<ApprovalAction, CaseStatus> = {
      SUBMIT: "SUBMITTED",
      APPROVE: "APPROVED",
      REJECT: "REJECTED"
    };
    await this.prisma.$transaction(async (tx) => {
      await tx.caseApproval.create({
        data: {
          caseId: id,
          actorId: userId,
          action,
          comment: comment ?? null
        }
      });
      await tx.procurementCase.update({
        where: { id },
        data: { status: statusMap[action] }
      });
    });
    await this.audit.record({
      orgId,
      userId,
      action: action === "SUBMIT" ? "SUBMIT" : action === "APPROVE" ? "APPROVE" : "REJECT",
      entity: "case-approval",
      entityId: id,
      caseId: id,
      after: { action, comment: comment ?? null },
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }
}
