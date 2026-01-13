import express from "express";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

type CommandResult = {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  durationMs: number;
};

class CommandError extends Error {
  result: CommandResult;

  constructor(message: string, result: CommandResult) {
    super(message);
    this.result = result;
  }
}

const runCommand = (command: string, args: string[], timeoutMs: number) => {
  return new Promise<CommandResult>((resolve, reject) => {
    const started = Date.now();
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      const result: CommandResult = {
        command,
        args,
        stdout,
        stderr: `${stderr}\nProcess timed out after ${timeoutMs}ms`,
        durationMs: Date.now() - started
      };
      reject(new CommandError("Command timed out", result));
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      const result: CommandResult = {
        command,
        args,
        stdout,
        stderr: `${stderr}\n${error.message}`,
        durationMs: Date.now() - started
      };
      reject(new CommandError(error.message, result));
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      const result: CommandResult = {
        command,
        args,
        stdout,
        stderr,
        durationMs: Date.now() - started
      };
      if (code === 0) {
        resolve(result);
      } else {
        reject(new CommandError(`Command exited with code ${code}`, result));
      }
    });
  });
};

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/convert", async (req, res) => {
  const { inputPath, outputDir, sheets, mode, timeoutMs } = req.body as {
    inputPath: string;
    outputDir: string;
    sheets?: string[];
    mode: "perSheet" | "singlePdf";
    timeoutMs?: number;
  };

  if (!inputPath || !outputDir) {
    return res.status(400).json({ error: "Missing inputPath or outputDir" });
  }

  const safeSheets = Array.isArray(sheets) ? sheets : [];
  const deadline = typeof timeoutMs === "number" ? timeoutMs : 120000;

  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    const soffice = await runCommand(
      "soffice",
      [
        "--headless",
        "--nologo",
        "--nofirststartwizard",
        "--convert-to",
        "pdf:calc_pdf_Export",
        "--outdir",
        outputDir,
        inputPath
      ],
      deadline
    );

    const basePdf = path.join(outputDir, `${path.basename(inputPath, path.extname(inputPath))}.pdf`);
    if (!fs.existsSync(basePdf)) {
      return res.status(500).json({ error: "PDF output not found", logs: { soffice } });
    }

    if (mode === "singlePdf") {
      return res.json({ files: [basePdf], logs: { soffice } });
    }

    const pdfseparate = await runCommand(
      "pdfseparate",
      [basePdf, path.join(outputDir, "page-%d.pdf")],
      deadline
    );

    const pageFiles = fs
      .readdirSync(outputDir)
      .filter((file) => file.startsWith("page-") && file.endsWith(".pdf"))
      .sort((a, b) => {
        const aNum = Number(a.replace(/[^\d]/g, ""));
        const bNum = Number(b.replace(/[^\d]/g, ""));
        return aNum - bNum;
      });

    const files: string[] = [];
    if (safeSheets.length > 0) {
      safeSheets.forEach((sheet, index) => {
        const source = path.join(outputDir, `page-${index + 1}.pdf`);
        if (!fs.existsSync(source)) {
          throw new Error(`Missing output page for sheet ${sheet}`);
        }
        const target = path.join(outputDir, `${sheet}.pdf`);
        fs.renameSync(source, target);
        files.push(target);
      });
      pageFiles.forEach((file) => {
        const filePath = path.join(outputDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } else {
      files.push(...pageFiles.map((file) => path.join(outputDir, file)));
    }

    return res.json({ files, logs: { soffice, pdfseparate } });
  } catch (error) {
    if (error instanceof CommandError) {
      return res.status(500).json({ error: error.message, logs: error.result });
    }
    const message = error instanceof Error ? error.message : "Conversion failed";
    return res.status(500).json({ error: message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Converter running on ${port}`);
});
