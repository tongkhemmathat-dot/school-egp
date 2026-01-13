import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { GenerateDocumentSchema, OverrideDocumentNumberSchema } from "@school-egp/shared";
import { parseSchema } from "../../common/validation";
import { getRequestMeta } from "../../common/request-meta";
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
    @Body() body: { packId: string; inputs: Record<string, string>; pdfMode?: "perSheet" | "singlePdf" }
  ) {
    const payload = parseSchema(GenerateDocumentSchema, body);
    return this.documents.generatePack(
      req.user.orgId,
      req.user.sub,
      caseId,
      payload.packId,
      payload.inputs,
      payload.pdfMode,
      getRequestMeta(req)
    );
  }

  @Post("override-number")
  @Roles("Admin", "ProcurementOfficer")
  overrideNumber(
    @Req() req: any,
    @Param("caseId") caseId: string,
    @Body() body: { documentId: string; number: string; reason: string; documentDate?: string }
  ) {
    const payload = parseSchema(OverrideDocumentNumberSchema, body);
    return this.documents.overrideNumber(
      req.user.orgId,
      req.user.sub,
      payload.documentId,
      payload.number,
      payload.reason,
      payload.documentDate ?? null,
      getRequestMeta(req)
    );
  }

  @Get("download-zip")
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  async downloadZip(@Req() req: any, @Param("caseId") caseId: string, @Res() res: Response) {
    const zipDoc = await this.documents.downloadZip(req.user.orgId, caseId);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipDoc.fileName}`);
    return res.sendFile(zipDoc.filePath);
  }
}

@Controller("documents")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class DocumentsDownloadController {
  constructor(private readonly documents: DocumentsService) {}

  @Get(":docId/download")
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  async download(@Req() req: any, @Param("docId") docId: string, @Res() res: Response) {
    const doc = await this.documents.findDocument(req.user.orgId, docId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${doc.fileName}`);
    return res.sendFile(doc.filePath);
  }
}
