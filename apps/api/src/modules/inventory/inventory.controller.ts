import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { CreateRequisitionSchema, UpdateRequisitionSchema } from "@school-egp/shared";
import { parseSchema } from "../../common/validation";
import { getRequestMeta } from "../../common/request-meta";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post("requisitions")
  @Roles("Admin", "ProcurementOfficer")
  createRequisition(@Req() req: any, @Body() body: any) {
    const payload = parseSchema(CreateRequisitionSchema, body);
    return this.inventory.createRequisition(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Get("requisitions")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  listRequisitions(@Req() req: any) {
    return this.inventory.listRequisitions(req.user.orgId);
  }

  @Get("requisitions/:id")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  getRequisition(@Req() req: any, @Param("id") id: string) {
    return this.inventory.getRequisition(req.user.orgId, id);
  }

  @Post("requisitions/:id/issue")
  @Roles("Admin", "ProcurementOfficer")
  async issueRequisition(@Req() req: any, @Param("id") id: string) {
    await this.inventory.issueRequisition(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Patch("requisitions/:id")
  @Roles("Admin", "ProcurementOfficer")
  updateRequisition(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const payload = parseSchema(UpdateRequisitionSchema, body);
    return this.inventory.updateRequisition(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Delete("requisitions/:id")
  @Roles("Admin", "ProcurementOfficer")
  async deleteRequisition(@Req() req: any, @Param("id") id: string) {
    await this.inventory.deleteRequisition(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Get("stock-card")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  stockCard(
    @Req() req: any,
    @Query("itemId") itemId: string,
    @Query("warehouseId") warehouseId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.inventory.stockCard({ orgId: req.user.orgId, itemId, warehouseId, from, to });
  }

  @Get("stock-card/export")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  async exportStockCard(
    @Req() req: any,
    @Res() res: Response,
    @Query("itemId") itemId: string,
    @Query("warehouseId") warehouseId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    const workbook = await this.inventory.exportStockCard({ orgId: req.user.orgId, itemId, warehouseId, from, to });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=stock-card.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  }
}
