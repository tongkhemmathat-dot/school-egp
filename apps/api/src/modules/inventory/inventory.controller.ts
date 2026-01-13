import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post("requisitions")
  @Roles("Admin", "ProcurementOfficer")
  createRequisition(
    @Req() req: any,
    @Body() body: { materialCode: string; quantity: number; requester: string }
  ) {
    return this.inventory.createRequisition(req.user.orgId, req.user.sub, body);
  }

  @Get("stock-card/:materialCode")
  @Roles("Admin", "ProcurementOfficer", "Viewer")
  stockCard(@Req() req: any, @Param("materialCode") materialCode: string) {
    return this.inventory.stockCard(req.user.orgId, materialCode);
  }
}
