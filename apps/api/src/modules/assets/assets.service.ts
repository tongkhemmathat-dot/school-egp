import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import ExcelJS from "exceljs";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listAssets(orgId: string) {
    return this.prisma.asset.findMany({
      where: { orgId },
      include: { policy: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getAsset(orgId: string, id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { policy: true, depreciationLines: true }
    });
    if (!asset || asset.orgId !== orgId) throw new NotFoundException("Asset not found");
    return asset;
  }

  async listPolicies(orgId: string) {
    return this.prisma.depreciationPolicy.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } });
  }

  async createPolicy(
    orgId: string,
    userId: string,
    data: { name: string; method: string; isDefault?: boolean },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    if (data.isDefault) {
      await this.prisma.depreciationPolicy.updateMany({ where: { orgId }, data: { isDefault: false } });
    }
    const policy = await this.prisma.depreciationPolicy.create({
      data: {
        orgId,
        name: data.name,
        method: data.method as any,
        isDefault: data.isDefault ?? false
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "depreciation-policy",
      entityId: policy.id,
      after: policy,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return policy;
  }

  async updatePolicy(
    orgId: string,
    userId: string,
    id: string,
    data: { name?: string; method?: string; isDefault?: boolean },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.depreciationPolicy.findFirst({ where: { id, orgId } });
    if (!before) throw new NotFoundException("Depreciation policy not found");
    if (data.isDefault) {
      await this.prisma.depreciationPolicy.updateMany({ where: { orgId }, data: { isDefault: false } });
    }
    const updated = await this.prisma.depreciationPolicy.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        method: (data.method as any) ?? undefined,
        isDefault: data.isDefault ?? undefined
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "depreciation-policy",
      entityId: id,
      before,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }

  async deletePolicy(
    orgId: string,
    userId: string,
    id: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.depreciationPolicy.findFirst({ where: { id, orgId } });
    if (!before) throw new NotFoundException("Depreciation policy not found");
    const assetCount = await this.prisma.asset.count({ where: { policyId: id, orgId } });
    if (assetCount > 0) {
      throw new BadRequestException("Policy is in use by assets");
    }
    await this.prisma.depreciationPolicy.delete({ where: { id } });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "depreciation-policy",
      entityId: id,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async createAsset(
    orgId: string,
    userId: string,
    data: {
      name: string;
      assetCode: string;
      acquisitionDate: string;
      cost: number;
      salvageValue: number;
      usefulLifeMonths: number;
      policyId: string;
    },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const policy = await this.prisma.depreciationPolicy.findFirst({ where: { id: data.policyId, orgId } });
    if (!policy) throw new NotFoundException("Depreciation policy not found");
    if (data.salvageValue > data.cost) {
      throw new BadRequestException("Salvage value cannot exceed cost");
    }
    const asset = await this.prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({
        data: {
          orgId,
          name: data.name,
          assetCode: data.assetCode,
          acquisitionDate: new Date(data.acquisitionDate),
          cost: data.cost,
          salvageValue: data.salvageValue,
          usefulLifeMonths: data.usefulLifeMonths,
          policyId: data.policyId
        }
      });
      const monthly = (data.cost - data.salvageValue) / data.usefulLifeMonths;
      const lines = Array.from({ length: data.usefulLifeMonths }).map((_, index) => {
        const period = new Date(data.acquisitionDate);
        period.setMonth(period.getMonth() + index);
        const accumulated = monthly * (index + 1);
        return {
          assetId: created.id,
          periodDate: period,
          amount: monthly,
          accumulated,
          bookValue: data.cost - accumulated
        };
      });
      await tx.depreciationLine.createMany({ data: lines });
      return created;
    });
    await this.audit.record({
      orgId,
      userId,
      action: "CREATE",
      entity: "asset",
      entityId: asset.id,
      after: asset,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return asset;
  }

  async updateAsset(
    orgId: string,
    userId: string,
    id: string,
    data: {
      name?: string;
      assetCode?: string;
      acquisitionDate?: string;
      cost?: number;
      salvageValue?: number;
      usefulLifeMonths?: number;
      policyId?: string;
    },
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.asset.findUnique({
      where: { id },
      include: { depreciationLines: true }
    });
    if (!before || before.orgId !== orgId) throw new NotFoundException("Asset not found");
    if (data.policyId) {
      const policy = await this.prisma.depreciationPolicy.findFirst({ where: { id: data.policyId, orgId } });
      if (!policy) throw new NotFoundException("Depreciation policy not found");
    }
    const shouldRecalc =
      data.acquisitionDate !== undefined ||
      data.cost !== undefined ||
      data.salvageValue !== undefined ||
      data.usefulLifeMonths !== undefined ||
      data.policyId !== undefined;
    const nextCost = data.cost ?? before.cost;
    const nextSalvage = data.salvageValue ?? before.salvageValue;
    if (nextSalvage > nextCost) {
      throw new BadRequestException("Salvage value cannot exceed cost");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          assetCode: data.assetCode ?? undefined,
          acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
          cost: data.cost ?? undefined,
          salvageValue: data.salvageValue ?? undefined,
          usefulLifeMonths: data.usefulLifeMonths ?? undefined,
          policyId: data.policyId ?? undefined
        }
      });
      if (shouldRecalc) {
        await tx.depreciationLine.deleteMany({ where: { assetId: id } });
        const monthly = (asset.cost - asset.salvageValue) / asset.usefulLifeMonths;
        const lines = Array.from({ length: asset.usefulLifeMonths }).map((_, index) => {
          const period = new Date(asset.acquisitionDate);
          period.setMonth(period.getMonth() + index);
          const accumulated = monthly * (index + 1);
          return {
            assetId: asset.id,
            periodDate: period,
            amount: monthly,
            accumulated,
            bookValue: asset.cost - accumulated
          };
        });
        await tx.depreciationLine.createMany({ data: lines });
      }
      return asset;
    });
    const after = await this.prisma.asset.findUnique({
      where: { id },
      include: { depreciationLines: true }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "UPDATE",
      entity: "asset",
      entityId: id,
      before,
      after: after || updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return after;
  }

  async deleteAsset(
    orgId: string,
    userId: string,
    id: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const before = await this.prisma.asset.findUnique({
      where: { id },
      include: { depreciationLines: true }
    });
    if (!before || before.orgId !== orgId) throw new NotFoundException("Asset not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.depreciationLine.deleteMany({ where: { assetId: id } });
      await tx.asset.delete({ where: { id } });
    });
    await this.audit.record({
      orgId,
      userId,
      action: "DELETE",
      entity: "asset",
      entityId: id,
      before,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
  }

  async exportAssetRegister(orgId: string) {
    const assets = await this.prisma.asset.findMany({
      where: { orgId },
      include: { policy: true },
      orderBy: { createdAt: "desc" }
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Asset Register");
    sheet.addRow(["Asset Code", "Name", "Cost", "Salvage", "Useful Life (months)", "Policy"]);
    assets.forEach((asset) => {
      sheet.addRow([
        asset.assetCode,
        asset.name,
        asset.cost,
        asset.salvageValue,
        asset.usefulLifeMonths,
        asset.policy.name
      ]);
    });
    return workbook;
  }

  async exportDepreciationSchedule(orgId: string, assetId: string) {
    const asset = await this.getAsset(orgId, assetId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Depreciation Schedule");
    sheet.addRow(["Period", "Amount", "Accumulated", "Book Value"]);
    asset.depreciationLines
      .slice()
      .sort((a, b) => a.periodDate.getTime() - b.periodDate.getTime())
      .forEach((line) => {
      sheet.addRow([
        line.periodDate.toISOString().slice(0, 10),
        line.amount,
        line.accumulated,
        line.bookValue
      ]);
      });
    return workbook;
  }
}
