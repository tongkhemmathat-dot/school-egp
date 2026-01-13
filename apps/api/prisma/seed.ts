import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: "Demo School"
    }
  });

  await prisma.user.create({
    data: {
      orgId: org.id,
      name: "Admin",
      email: "admin@school.local",
      passwordHash: await hash("admin123", 10),
      role: "Admin"
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
