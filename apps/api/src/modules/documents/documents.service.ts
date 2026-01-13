import fs from "node:fs";
import path from "node:path";
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import ExcelJS from "exceljs";
import archiver from "archiver";
import type { DocumentFileType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { TemplatesService } from "../templates/templates.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly audit: AuditService
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
    workbook.calcProperties.fullCalcOnLoad = true;
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(`${process.env.CONVERTER_URL || "http://converter:5000"}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputPath: params.workbookPath,
        outputDir: params.outputDir,
        sheets: params.pack.outputSheets,
        mode: params.pack.pdfMode
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = (await response.json()) as { error?: string };
        if (errorBody?.error) detail = errorBody.error;
      } catch {
        // ignore
      }
      throw new Error(`Converter failed: ${detail}`);
    }
    return (await response.json()) as { files: string[]; logs?: Record<string, unknown> };
  }

  private async nextRunningNumber(
    orgId: string,
    fiscalYear: number,
    documentType: string,
    userId: string,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.documentRunningNumber.findUnique({
        where: { orgId_fiscalYear_documentType: { orgId, fiscalYear, documentType } }
      });
      if (!existing) {
        const created = await tx.documentRunningNumber.create({
          data: { orgId, fiscalYear, documentType, sequence: 1 }
        });
        return { row: created, before: null, action: "CREATE" as const };
      }
      const updated = await tx.documentRunningNumber.update({
        where: { id: existing.id },
        data: { sequence: { increment: 1 } }
      });
      return { row: updated, before: existing, action: "UPDATE" as const };
    });
    await this.audit.record({
      orgId,
      userId,
      action: result.action,
      entity: "document-running-number",
      entityId: result.row.id,
      before: result.before ?? undefined,
      after: result.row,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    const seq = result.row.sequence.toString().padStart(4, "0");
    return `${documentType}-${fiscalYear}-${seq}`;
  }

  private async createZip(files: string[], outputDir: string, zipName: string) {
    const zipPath = path.join(outputDir, zipName);
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));
      archive.pipe(output);
      files.forEach((filePath) => {
        archive.file(filePath, { name: path.basename(filePath) });
      });
      archive.finalize();
    });
    return zipPath;
  }

  async generatePack(
    orgId: string,
    userId: string,
    caseId: string,
    packId: string,
    inputs: Record<string, string>,
    pdfMode?: "perSheet" | "singlePdf",
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const caseData = await this.prisma.procurementCase.findUnique({ where: { id: caseId } });
    if (!caseData || caseData.orgId !== orgId) throw new NotFoundException("Case not found");
    const packStatus = await this.prisma.templatePack.findFirst({ where: { orgId, packId } });
    if (packStatus && !packStatus.isActive) {
      throw new BadRequestException("Template pack is inactive");
    }
    const workDir = path.join(this.dataRoot(), orgId, caseId, "work");
    await this.ensureDir(workDir);

    const { workbookPath, pack } = await this.applyTemplate(packId, inputs, workDir);
    const outputDir = path.join(this.dataRoot(), orgId, caseId, "documents");
    await this.ensureDir(outputDir);

    const conversion = await this.convertToPdf({
      workbookPath,
      outputDir,
      pack: { ...pack, pdfMode: pdfMode || pack.pdfMode }
    });
    const documentType = packId;
    const runningNumber = await this.nextRunningNumber(
      orgId,
      caseData.fiscalYear,
      documentType,
      userId,
      meta
    );

    const docs = await Promise.all(
      conversion.files.map((filePath) =>
        this.prisma.document.create({
          data: {
            orgId,
            caseId,
            templatePackId: packId,
            documentType,
            fileType: "PDF",
            fileName: path.basename(filePath),
            filePath,
            runningNumber,
            documentDate: new Date()
          }
        })
      )
    );

    const zipName = `${packId}-${runningNumber}.zip`;
    const zipPath = await this.createZip(conversion.files, outputDir, zipName);
    const zipDoc = await this.prisma.document.create({
      data: {
        orgId,
        caseId,
        templatePackId: packId,
        documentType,
        fileType: "ZIP",
        fileName: zipName,
        filePath: zipPath,
        runningNumber,
        documentDate: new Date()
      }
    });

    await this.audit.record({
      orgId,
      userId,
      action: "GENERATE",
      entity: "document",
      entityId: caseId,
      caseId,
      after: { packId, files: conversion.files, zip: zipName },
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });

    return { documents: docs, zip: zipDoc, files: conversion.files };
  }

  async listDocuments(orgId: string, caseId: string) {
    return this.prisma.document.findMany({
      where: { orgId, caseId },
      orderBy: { generatedAt: "desc" }
    });
  }

  async findDocument(orgId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.orgId !== orgId) throw new NotFoundException("Document not found");
    return doc;
  }

  async downloadZip(orgId: string, caseId: string) {
    const zipDoc = await this.prisma.document.findFirst({
      where: { orgId, caseId, fileType: "ZIP" as DocumentFileType },
      orderBy: { generatedAt: "desc" }
    });
    if (!zipDoc) throw new NotFoundException("ZIP not found");
    return zipDoc;
  }

  async overrideNumber(
    orgId: string,
    userId: string,
    documentId: string,
    number: string,
    reason: string,
    documentDate?: string | null,
    meta?: { ip?: string | null; userAgent?: string | null }
  ) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc || doc.orgId !== orgId) {
      throw new NotFoundException("Document not found");
    }
    const caseData = await this.prisma.procurementCase.findUnique({ where: { id: doc.caseId } });
    if (!caseData || !caseData.isBackdated) {
      throw new BadRequestException("Document override allowed only for backdated cases");
    }
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        manualNumber: number,
        documentDate: documentDate ? new Date(documentDate) : doc.documentDate
      }
    });
    await this.audit.record({
      orgId,
      userId,
      action: "OVERRIDE",
      entity: "document-number",
      entityId: documentId,
      caseId: doc.caseId,
      before: { manualNumber: doc.manualNumber, documentDate: doc.documentDate },
      after: { manualNumber: updated.manualNumber, documentDate: updated.documentDate },
      reason,
      ip: meta?.ip,
      userAgent: meta?.userAgent
    });
    return updated;
  }
}
