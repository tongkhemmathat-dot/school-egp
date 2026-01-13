import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { PrismaService } from "../../prisma/prisma.service";
import { TemplatesModule } from "../templates/templates.module";
import { AuditModule } from "../audit/audit.module";
import { CasesModule } from "../cases/cases.module";

@Module({
  imports: [TemplatesModule, AuditModule, CasesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService]
})
export class DocumentsModule {}
