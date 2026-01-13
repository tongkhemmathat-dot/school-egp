import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { hash } from "bcryptjs";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listOrgs() {
    return this.prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createUser(
    orgId: string,
    userId: string,
    data: { name: string; email: string; password: string; role: string }
  ) {
    const user = await this.prisma.user.create({
      data: {
        orgId,
        name: data.name,
        email: data.email,
        passwordHash: await hash(data.password, 10),
        role: data.role
      }
    });
    const { passwordHash, ...safeUser } = user;
    await this.audit.record({
      orgId,
      userId,
      action: "create",
      entity: "user",
      entityId: user.id,
      after: safeUser
    });
    return safeUser;
  }
}
