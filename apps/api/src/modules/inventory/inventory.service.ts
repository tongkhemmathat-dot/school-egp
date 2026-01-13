import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import ExcelJS from "exceljs";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async createRequisition(
    orgId: string,
    userId: string,
    data: {
      requesterName: string;
      warehouseId: string;
      lines: { itemId: string; quantity: number }[];
    },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const requisition = await this.prisma.$transaction(async (tx) => {
      const header = await tx.materialRequisition.create({
        data: {
          orgId,
          requesterId: userId,
          requesterName: data.requesterName,
          warehouseId: data.warehouseId,
          status: "DRAFT"
        }
      });
      if (data.lines.length > 0) {
        await tx.materialRequisitionLine.createMany({
          data: data.lines.map((line) => ({
            requisitionId: header.id,
            itemId: line.itemId,
            quantity: line.quantity
          }))
        });
      }
      return header;
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "material-requisition",
      entityId: requisition.id,
      after: requisition,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return requisition;
  }

  async listRequisitions(orgId: string) {
    return this.prisma.materialRequisition.findMany({
      where: { orgId },
      include: { warehouse: true, lines: { include: { item: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async getRequisition(orgId: string, id: string) {
    const req = await this.prisma.materialRequisition.findUnique({
      where: { id },
      include: { warehouse: true, lines: { include: { item: true } } }
    });
    if (!req || req.orgId !== orgId) throw new NotFoundException("Requisition not found");
    return req;
  }

  async issueRequisition(
    orgId: string,
    userId: string,
    id: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const requisition = await this.prisma.materialRequisition.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!requisition || requisition.orgId !== orgId) throw new NotFoundException("Requisition not found");
    if (requisition.status === "ISSUED") {
      throw new BadRequestException("Requisition already issued");
    }
    const transactions = requisition.lines.map((line) => ({
      orgId,
      itemId: line.itemId,
      warehouseId: requisition.warehouseId,
      transactionType: "OUT" as const,
      quantity: line.quantity,
      referenceType: "requisition",
      referenceId: requisition.id
    }));
    await this.prisma.$transaction(async (tx) => {
      await tx.stockTransaction.createMany({
        data: transactions.map((line) => ({
          orgId,
          itemId: line.itemId,
          warehouseId: requisition.warehouseId,
          transactionType: "OUT",
          quantity: line.quantity,
          referenceType: "requisition",
          referenceId: requisition.id
        }))
      });
      await tx.materialRequisition.update({
        where: { id },
        data: { status: "ISSUED" }
      });
    });
    await this.audit.record({
      orgId,
      userId,
      action: "GENERATE",
      entity: "stock-transaction",
      entityId: requisition.id,
      after: { requisitionId: requisition.id, transactions },
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async updateRequisition(
    orgId: string,
    userId: string,
    id: string,
    data: {
      requesterName?: string;
      warehouseId?: string;
      lines?: { itemId: string; quantity: number }[];
    },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.materialRequisition.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!before || before.orgId !== orgId) throw new NotFoundException("Requisition not found");
    if (before.status === "ISSUED") {
      throw new BadRequestException("Issued requisitions cannot be updated");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.materialRequisition.update({
        where: { id },
        data: {
          requesterName: data.requesterName ?? undefined,
          warehouseId: data.warehouseId ?? undefined
        }
      });
      if (data.lines) {
        await tx.materialRequisitionLine.deleteMany({ where: { requisitionId: id } });
        if (data.lines.length > 0) {
          await tx.materialRequisitionLine.createMany({
            data: data.lines.map((line) => ({
              requisitionId: id,
              itemId: line.itemId,
              quantity: line.quantity
            }))
          });
        }
      }
    });
    const after = await this.prisma.materialRequisition.findUnique({
      where: { id },
      include: { lines: true }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "material-requisition",
      entityId: id,
      before,
      after: after || undefined,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return after;
  }

  async deleteRequisition(
    orgId: string,
    userId: string,
    id: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.materialRequisition.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!before || before.orgId !== orgId) throw new NotFoundException("Requisition not found");
    if (before.status === "ISSUED") {
      throw new BadRequestException("Issued requisitions cannot be deleted");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.materialRequisitionLine.deleteMany({ where: { requisitionId: id } });
      await tx.materialRequisition.delete({ where: { id } });
    });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "material-requisition",
      entityId: id,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async stockCard(params: {
    orgId: string;
    itemId: string;
    warehouseId: string;
    from?: string;
    to?: string;
  }) {
    let balance = 0;
    if (params.from) {
      const prior = await this.prisma.stockTransaction.findMany({
        where: {
          orgId: params.orgId,
          itemId: params.itemId,
          warehouseId: params.warehouseId,
          createdAt: { lt: new Date(params.from) }
        }
      });
      balance = prior.reduce(
        (sum, tx) => sum + (tx.transactionType === "IN" ? tx.quantity : -tx.quantity),
        0
      );
    }
    const transactions = await this.prisma.stockTransaction.findMany({
      where: {
        orgId: params.orgId,
        itemId: params.itemId,
        warehouseId: params.warehouseId,
        ...(params.from || params.to
          ? {
              createdAt: {
                ...(params.from ? { gte: new Date(params.from) } : {}),
                ...(params.to ? { lte: new Date(params.to) } : {})
              }
            }
          : {})
      },
      orderBy: { createdAt: "asc" }
    });
    return transactions.map((tx) => {
      balance += tx.transactionType === "IN" ? tx.quantity : -tx.quantity;
      return { ...tx, balance };
    });
  }

  async exportStockCard(params: {
    orgId: string;
    itemId: string;
    warehouseId: string;
    from?: string;
    to?: string;
  }) {
    const rows = await this.stockCard(params);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stock Card");
    sheet.addRow(["Date", "Type", "Qty", "Balance", "Ref"]);
    rows.forEach((row) => {
      sheet.addRow([
        row.createdAt.toISOString().slice(0, 10),
        row.transactionType,
        row.quantity,
        row.balance,
        row.referenceId || ""
      ]);
    });
    return workbook;
  }
}
