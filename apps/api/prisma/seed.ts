import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const existingOrg = await prisma.organization.findFirst({ where: { name: "Demo School" } });
  const org =
    existingOrg ||
    (await prisma.organization.create({
      data: {
        name: "Demo School"
      }
    }));

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      orgId: org.id,
      name: "Admin",
      email: "admin@example.com",
      passwordHash: await hash("Admin@1234", 10),
      role: Role.Admin
    }
  });

  const existingPolicy = await prisma.depreciationPolicy.findFirst({
    where: { orgId: org.id, isDefault: true }
  });
  if (!existingPolicy) {
    await prisma.depreciationPolicy.create({
      data: {
        orgId: org.id,
        name: "Default Straight Line",
        method: "STRAIGHT_LINE",
        isDefault: true
      }
    });
  }

  const templatesDir = (() => {
    const direct = path.resolve(process.cwd(), "templates");
    if (fs.existsSync(direct)) return direct;
    return path.resolve(process.cwd(), "..", "..", "templates");
  })();
  if (fs.existsSync(templatesDir)) {
    const dirs = fs.readdirSync(templatesDir, { withFileTypes: true }).filter((dir) => dir.isDirectory());
    for (const dir of dirs) {
      const packPath = path.join(templatesDir, dir.name, "pack.json");
      if (!fs.existsSync(packPath)) continue;
      const raw = fs.readFileSync(packPath, "utf8");
      const pack = JSON.parse(raw) as { id: string; name_th: string; caseType: string; subtype?: string };
      const existingPack = await prisma.templatePack.findFirst({
        where: { orgId: org.id, packId: pack.id }
      });
      if (existingPack) {
        await prisma.templatePack.update({
          where: { id: existingPack.id },
          data: {
            name: pack.name_th,
            caseType: pack.caseType as any,
            subtype: (pack.subtype || null) as any
          }
        });
      } else {
        await prisma.templatePack.create({
          data: {
            orgId: org.id,
            packId: pack.id,
            name: pack.name_th,
            caseType: pack.caseType as any,
            subtype: (pack.subtype || null) as any,
            isActive: true
          }
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
