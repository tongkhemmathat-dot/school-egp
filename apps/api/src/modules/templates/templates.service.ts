import fs from "node:fs";
import path from "node:path";

export type TemplatePack = {
  id: string;
  name_th: string;
  caseType: string;
  inputCells: { key: string; sheet: string; cell: string }[];
  outputSheets: string[];
  pdfMode: "perSheet" | "singlePdf";
};

export class TemplatesService {
  private readonly templatesDir = path.resolve(process.cwd(), "templates");

  listPacks(): TemplatePack[] {
    const dirs = fs.readdirSync(this.templatesDir, { withFileTypes: true }).filter((dir) => dir.isDirectory());
    return dirs.map((dir) => this.loadPack(dir.name)).filter(Boolean) as TemplatePack[];
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
