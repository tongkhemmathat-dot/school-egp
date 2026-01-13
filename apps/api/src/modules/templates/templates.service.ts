import fs from "node:fs";
import path from "node:path";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export type TemplatePack = {
  id: string;
  name_th: string;
  caseType: string;
  subtype?: string;
  inputCells: { key: string; sheet: string; cell: string }[];
  outputSheets: string[];
  pdfMode: "perSheet" | "singlePdf";
};

export type TemplatePackWithStatus = TemplatePack & {
  isActive: boolean;
};

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private get templatesDir() {
    const direct = path.resolve(process.cwd(), "templates");
    if (fs.existsSync(direct)) {
      return direct;
    }
    return path.resolve(process.cwd(), "..", "..", "templates");
  }

  async listPacks(orgId: string): Promise<TemplatePackWithStatus[]> {
    const dirs = fs.readdirSync(this.templatesDir, { withFileTypes: true }).filter((dir) => dir.isDirectory());
    const packs = dirs.map((dir) => this.loadPack(dir.name)).filter(Boolean) as TemplatePack[];
    const stored = await this.prisma.templatePack.findMany({ where: { orgId } });
    return packs.map((pack) => {
      const row = stored.find((item) => item.packId === pack.id);
      return {
        ...pack,
        isActive: row ? row.isActive : true
      };
    });
  }

  loadPack(packId: string): TemplatePack {
    const packPath = path.join(this.templatesDir, packId, "pack.json");
    const raw = fs.readFileSync(packPath, "utf8");
    return JSON.parse(raw) as TemplatePack;
  }

  resolveTemplatePath(packId: string) {
    return path.join(this.templatesDir, packId, "template.xlsm");
  }
}
