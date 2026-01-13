import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async createRequisition(
    orgId: string,
    userId: string,
    data: { materialCode: string; quantity: number; requester: string }
  ) {
    const requisition = await this.prisma.materialRequisition.create({
      data: {
        orgId,
        materialCode: data.materialCode,
        quantity: data.quantity,
        requester: data.requester
      }
    });

    const stockTx = await this.prisma.stockTransaction.create({
      data: {
        orgId,
        materialCode: data.materialCode,
        quantity: data.quantity,
        transactionType: "OUT",
        referenceId: requisition.id
      }
    });

    await this.audit.record({
      orgId,
      userId,
      action: "create",
      entity: "stock-transaction",
      entityId: stockTx.id,
      after: stockTx
    });

    return { requisition, stockTx };
  }

  async stockCard(orgId: string, materialCode: string) {
    const transactions = await this.prisma.stockTransaction.findMany({
      where: { orgId, materialCode },
      orderBy: { createdAt: "asc" }
    });
    let balance = 0;
    return transactions.map((tx) => {
      balance += tx.transactionType === "IN" ? tx.quantity : -tx.quantity;
      return { ...tx, balance };
    });
  }
}
