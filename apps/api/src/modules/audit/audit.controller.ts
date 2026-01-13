import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "../../prisma/prisma.service";
import { Roles, RolesGuard } from "../auth/roles.guard";

@Controller("audit")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles("Admin", "ProcurementOfficer", "Approver")
  list(
    @Req() req: any,
    @Query("entity") entity?: string,
    @Query("caseId") caseId?: string
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        orgId: req.user.orgId,
        ...(entity ? { entity } : {}),
        ...(caseId ? { caseId } : {})
      },
      orderBy: { createdAt: "desc" }
    });
  }
}
