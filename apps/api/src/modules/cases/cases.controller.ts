import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  CreateCaseSchema,
  SubmitApprovalSchema,
  UpdateCaseSchema
} from "@school-egp/shared";
import { parseSchema } from "../../common/validation";
import { getRequestMeta } from "../../common/request-meta";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { CasesService } from "./cases.service";

@Controller("cases")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  list(
    @Req() req: any,
    @Query("status") status?: string,
    @Query("caseType") caseType?: string,
    @Query("vendorId") vendorId?: string,
    @Query("fiscalYear") fiscalYear?: string
  ) {
    return this.cases.list(req.user.orgId, {
      status: status as any,
      caseType,
      vendorId,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined
    });
  }

  @Post()
  @Roles("Admin", "ProcurementOfficer")
  create(@Req() req: any, @Body() body: any) {
    const payload = parseSchema(CreateCaseSchema, body);
    return this.cases.create(req.user.orgId, req.user.sub, payload, getRequestMeta(req));
  }

  @Get(":id")
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  get(@Req() req: any, @Param("id") id: string) {
    return this.cases.get(req.user.orgId, id);
  }

  @Patch(":id")
  @Roles("Admin", "ProcurementOfficer")
  update(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const payload = parseSchema(UpdateCaseSchema, body);
    return this.cases.update(req.user.orgId, req.user.sub, id, payload, getRequestMeta(req));
  }

  @Put(":id/lines")
  @Roles("Admin", "ProcurementOfficer")
  updateLines(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const payload = parseSchema(CreateCaseSchema.pick({ lines: true }), body);
    return this.cases.updateLines(req.user.orgId, req.user.sub, id, payload.lines, getRequestMeta(req));
  }

  @Delete(":id")
  @Roles("Admin")
  async delete(@Req() req: any, @Param("id") id: string) {
    await this.cases.delete(req.user.orgId, req.user.sub, id, getRequestMeta(req));
    return { ok: true };
  }

  @Post(":id/approvals")
  @Roles("Admin", "ProcurementOfficer", "Approver")
  approval(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const payload = parseSchema(SubmitApprovalSchema, body);
    return this.cases.recordApproval(
      req.user.orgId,
      req.user.sub,
      id,
      payload.action,
      payload.comment ?? null,
      getRequestMeta(req)
    );
  }
}
