import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { CasesService } from "./cases.service";

@Controller("cases")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  list(@Req() req: any) {
    return this.cases.list(req.user.orgId);
  }

  @Post()
  @Roles("Admin", "ProcurementOfficer")
  create(@Req() req: any, @Body() body: { title: string; caseType: string; isBackdated?: boolean }) {
    return this.cases.create(req.user.orgId, req.user.sub, body);
  }

  @Get(":id")
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  get(@Req() req: any, @Param("id") id: string) {
    return this.cases.get(req.user.orgId, id);
  }

  @Patch(":id")
  @Roles("Admin", "ProcurementOfficer")
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { title?: string; status?: string }
  ) {
    return this.cases.update(req.user.orgId, req.user.sub, id, body);
  }
}
