import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async createAsset(
    orgId: string,
    userId: string,
    data: { name: string; cost: number; acquiredDate: string; usefulLifeYears: number }
  ) {
    const asset = await this.prisma.asset.create({
      data: {
        orgId,
        name: data.name,
        cost: data.cost,
        acquiredDate: new Date(data.acquiredDate),
        usefulLifeYears: data.usefulLifeYears
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "create",
      entity: "asset",
      entityId: asset.id,
      after: asset
    });
    return asset;
  }

  async listAssets(orgId: string) {
    return this.prisma.asset.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } });
  }

  depreciationSchedule(asset: { cost: number; usefulLifeYears: number; acquiredDate: Date }) {
    const annual = asset.cost / asset.usefulLifeYears;
    return Array.from({ length: asset.usefulLifeYears }).map((_, index) => ({
      year: asset.acquiredDate.getFullYear() + index,
      depreciation: annual,
      accumulated: annual * (index + 1),
      bookValue: asset.cost - annual * (index + 1)
    }));
  }
}
