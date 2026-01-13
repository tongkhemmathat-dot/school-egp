import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { DocumentsService } from "./documents.service";

@Controller("cases/:caseId/documents")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  list(@Req() req: any, @Param("caseId") caseId: string) {
    return this.documents.listDocuments(req.user.orgId, caseId);
  }

  @Post("generate")
  @Roles("Admin", "ProcurementOfficer")
  generate(
    @Req() req: any,
    @Param("caseId") caseId: string,
    @Body() body: { packId: string; inputs: Record<string, string> }
  ) {
    return this.documents.generatePack(req.user.orgId, req.user.sub, caseId, body.packId, body.inputs);
  }

  @Post("override-number")
  @Roles("Admin", "ProcurementOfficer")
  overrideNumber(
    @Req() req: any,
    @Param("caseId") caseId: string,
    @Body() body: { documentNumber: string; reason: string }
  ) {
    return this.documents.updateDocumentNumber(
      req.user.orgId,
      req.user.sub,
      caseId,
      body.documentNumber,
      body.reason
    );
  }

  @Get("download-zip")
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  async downloadZip(@Req() req: any, @Param("caseId") caseId: string, @Res() res: Response) {
    const archive = await this.documents.streamZip(req.user.orgId, caseId);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=case-${caseId}.zip`);
    archive.pipe(res);
  }
}
