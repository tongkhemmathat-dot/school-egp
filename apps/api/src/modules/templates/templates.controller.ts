import { Body, Controller, Get, Patch, Param, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { TemplatesService } from "./templates.service";
import { PrismaService } from "../../prisma/prisma.service";
import { parseSchema } from "../../common/validation";
import { getRequestMeta } from "../../common/request-meta";
import { UpdateTemplatePackSchema } from "@school-egp/shared";
import { AuditService } from "../audit/audit.service";

@Controller("templates")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class TemplatesController {
  constructor(
    private readonly templates: TemplatesService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  @Get()
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  list(@Req() req: any) {
    return this.templates.listPacks(req.user.orgId);
  }

  @Patch(":packId")
  @Roles("Admin")
  async toggle(@Req() req: any, @Param("packId") packId: string, @Body() body: { isActive: boolean }) {
    const payload = parseSchema(UpdateTemplatePackSchema, body);
    const existing = await this.prisma.templatePack.findFirst({ where: { orgId: req.user.orgId, packId } });
    let result;
    if (existing) {
      result = await this.prisma.templatePack.update({
        where: { id: existing.id },
        data: { isActive: payload.isActive }
      });
      await this.audit.record({
        orgId: req.user.orgId,
        userId: req.user.sub,
        action: "UPDATE",
        entity: "template-pack",
        entityId: result.id,
        before: existing,
        after: result,
        ...getRequestMeta(req)
      });
      return result;
    }
    const pack = this.templates.loadPack(packId);
    result = await this.prisma.templatePack.create({
      data: {
        orgId: req.user.orgId,
        packId,
        name: pack.name_th,
        caseType: pack.caseType as any,
        subtype: (pack.subtype || null) as any,
        isActive: payload.isActive
      }
    });
    await this.audit.record({
      orgId: req.user.orgId,
      userId: req.user.sub,
      action: "CREATE",
      entity: "template-pack",
      entityId: result.id,
      after: result,
      ...getRequestMeta(req)
    });
    return result;
  }
}
