import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Asset } from "@prisma/client";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { AssetsService } from "./assets.service";

@Controller("assets")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  list(@Req() req: any) {
    return this.assets.listAssets(req.user.orgId);
  }

  @Post()
  @Roles("Admin", "ProcurementOfficer")
  create(
    @Req() req: any,
    @Body() body: { name: string; cost: number; acquiredDate: string; usefulLifeYears: number }
  ) {
    return this.assets.createAsset(req.user.orgId, req.user.sub, body);
  }

  @Get(":id/depreciation")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  async depreciation(@Req() req: any, @Param("id") id: string) {
    const asset = await this.assets
      .listAssets(req.user.orgId)
      .then((assets: Asset[]) => assets.find((a) => a.id === id));
    if (!asset) return [];
    return this.assets.depreciationSchedule(asset);
  }
}
