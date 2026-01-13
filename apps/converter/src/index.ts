import express from "express";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

const app = express();
app.use(express.json({ limit: "10mb" }));

const runLibreOffice = (inputPath: string, outputDir: string) => {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("soffice", [
      "--headless",
      "--nologo",
      "--nofirststartwizard",
      "--convert-to",
      "pdf:calc_pdf_Export",
      "--outdir",
      outputDir,
      inputPath
    ]);

    process.on("error", reject);
    process.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`LibreOffice failed with code ${code}`));
    });
  });
};

const runPdfSeparate = (inputPdf: string, outputDir: string) => {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("pdfseparate", [inputPdf, path.join(outputDir, "page-%d.pdf")]);
    process.on("error", reject);
    process.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pdfseparate failed with code ${code}`));
    });
  });
};

app.post("/convert", async (req, res) => {
  const { inputPath, outputDir, sheets, mode } = req.body as {
    inputPath: string;
    outputDir: string;
    sheets: string[];
    mode: "perSheet" | "singlePdf";
  };

  if (!inputPath || !outputDir) {
    return res.status(400).json({ error: "Missing inputPath or outputDir" });
  }

  await fs.promises.mkdir(outputDir, { recursive: true });
  await runLibreOffice(inputPath, outputDir);

  const basePdf = path.join(outputDir, `${path.basename(inputPath, path.extname(inputPath))}.pdf`);
  if (!fs.existsSync(basePdf)) {
    return res.status(500).json({ error: "PDF output not found" });
  }

  let files: string[] = [];
  if (mode === "singlePdf") {
    files = [basePdf];
  } else {
    await runPdfSeparate(basePdf, outputDir);
    files = sheets.map((sheet, index) => {
      const source = path.join(outputDir, `page-${index + 1}.pdf`);
      const target = path.join(outputDir, `${sheet}.pdf`);
      fs.renameSync(source, target);
      return target;
    });
  }

  return res.json({ files });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Converter running on ${port}`);
});
