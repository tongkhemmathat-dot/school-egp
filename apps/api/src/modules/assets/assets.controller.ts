import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import {
  CreateAssetSchema,
  CreateDepreciationPolicySchema,
  UpdateAssetSchema,
  UpdateDepreciationPolicySchema
} from "@school-egp/shared";
import { parseSchema } from "../../common/validation";
import { getRequestMeta } from "../../common/request-meta";
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
  create(@Req() req: any, @Body() body: any) {
    const payload = parseSchema(CreateAssetSchema, body);
    return this.assets.createAsset(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Get("policies")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  listPolicies(@Req() req: any) {
    return this.assets.listPolicies(req.user.orgId);
  }

  @Post("policies")
  @Roles("Admin")
  createPolicy(@Req() req: any, @Body() body: any) {
    const payload = parseSchema(CreateDepreciationPolicySchema, body);
    return this.assets.createPolicy(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Patch("policies/:id")
  @Roles("Admin")
  updatePolicy(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const payload = parseSchema(UpdateDepreciationPolicySchema, body);
    return this.assets.updatePolicy(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("policies/:id")
  @Roles("Admin")
  async deletePolicy(@Req() req: any, @Param("id") id: string) {
    await this.assets.deletePolicy(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("register/export")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  async exportRegister(@Req() req: any, @Res() res: Response) {
    const workbook = await this.assets.exportAssetRegister(req.user.orgId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=asset-register.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get(":id/depreciation/export")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  async exportDepreciation(@Req() req: any, @Param("id") id: string, @Res() res: Response) {
    const workbook = await this.assets.exportDepreciationSchedule(req.user.orgId, id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=asset-depreciation.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get(":id")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  get(@Req() req: any, @Param("id") id: string) {
    return this.assets.getAsset(req.user.orgId, id);
  }

  @Patch(":id")
  @Roles("Admin", "ProcurementOfficer")
  update(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const payload = parseSchema(UpdateAssetSchema, body);
    return this.assets.updateAsset(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete(":id")
  @Roles("Admin")
  async remove(@Req() req: any, @Param("id") id: string) {
    await this.assets.deleteAsset(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }
}
