import fs from "node:fs";
import path from "node:path";
import { Injectable, NotFoundException } from "@nestjs/common";
import ExcelJS from "exceljs";
import archiver from "archiver";
import type { Document } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TemplatesService } from "../templates/templates.service";
import { AuditService } from "../audit/audit.service";
import { CasesService } from "../cases/cases.service";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly audit: AuditService,
    private readonly cases: CasesService
  ) {}

  private dataRoot() {
    return process.env.DATA_ROOT || "/data";
  }

  private async ensureDir(target: string) {
    await fs.promises.mkdir(target, { recursive: true });
  }

  private async applyTemplate(packId: string, inputs: Record<string, string>, workDir: string) {
    const templatePath = this.templates.resolveTemplatePath(packId);
    const workbookPath = path.join(workDir, "filled.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const pack = this.templates.loadPack(packId);
    pack.inputCells.forEach((mapping) => {
      const sheet = workbook.getWorksheet(mapping.sheet);
      if (!sheet) return;
      sheet.getCell(mapping.cell).value = inputs[mapping.key] ?? "";
    });
    await workbook.xlsx.writeFile(workbookPath);
    return { workbookPath, pack };
  }

  private async convertToPdf(params: {
    workbookPath: string;
    outputDir: string;
    pack: { outputSheets: string[]; pdfMode: "perSheet" | "singlePdf" };
  }) {
    const response = await fetch(`${process.env.CONVERTER_URL || "http://converter:5000"}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputPath: params.workbookPath,
        outputDir: params.outputDir,
        sheets: params.pack.outputSheets,
        mode: params.pack.pdfMode
      })
    });
    if (!response.ok) {
      throw new Error(`Converter failed: ${response.statusText}`);
    }
    return (await response.json()) as { files: string[] };
  }

  async generatePack(orgId: string, userId: string, caseId: string, packId: string, inputs: Record<string, string>) {
    const caseData = await this.cases.get(orgId, caseId);
    if (!caseData) throw new NotFoundException("Case not found");
    const workDir = path.join(this.dataRoot(), orgId, caseId, "work");
    await this.ensureDir(workDir);

    const { workbookPath, pack } = await this.applyTemplate(packId, inputs, workDir);
    const outputDir = path.join(this.dataRoot(), orgId, caseId, "documents");
    await this.ensureDir(outputDir);

    const conversion = await this.convertToPdf({ workbookPath, outputDir, pack });

    const docs: Document[] = await Promise.all(
      conversion.files.map((filePath) =>
        this.prisma.document.create({
          data: {
            orgId,
            caseId,
            templatePackId: packId,
            fileName: path.basename(filePath),
            filePath,
            generatedAt: new Date()
          }
        })
      )
    );

    await this.audit.record({
      orgId,
      userId,
      action: "generate",
      entity: "document",
      entityId: caseId,
      caseId,
      after: { packId, files: conversion.files }
    });

    return { documents: docs, files: conversion.files };
  }

  async listDocuments(orgId: string, caseId: string) {
    return this.prisma.document.findMany({ where: { orgId, caseId }, orderBy: { generatedAt: "desc" } });
  }

  async streamZip(orgId: string, caseId: string) {
    const docs = await this.listDocuments(orgId, caseId);
    const archive = archiver("zip", { zlib: { level: 9 } });
    docs.forEach((doc) => {
      archive.file(doc.filePath, { name: doc.fileName });
    });
    archive.finalize();
    return archive;
  }

  async updateDocumentNumber(orgId: string, userId: string, caseId: string, newNumber: string, reason: string) {
    const caseData = await this.prisma.procurementCase.findUnique({ where: { id: caseId } });
    if (!caseData || caseData.orgId !== orgId) {
      throw new NotFoundException("Case not found");
    }
    if (!caseData.isBackdated) {
      throw new Error("Document numbers can only be overridden for backdated cases.");
    }
    const before = { documentNumber: caseData.documentNumber };
    const updated = await this.prisma.procurementCase.update({
      where: { id: caseId },
      data: { documentNumber: newNumber }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "override",
      entity: "document-number",
      entityId: caseId,
      caseId,
      before,
      after: { documentNumber: newNumber },
      reason
    });
    return updated;
  }
}
