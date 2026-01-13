import { Module } from "@nestjs/common";
import { DocumentsController, DocumentsDownloadController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { PrismaService } from "../../prisma/prisma.service";
import { TemplatesModule } from "../templates/templates.module";
import { AuditModule } from "../audit/audit.module";
@Module({
  imports: [TemplatesModule, AuditModule],
  controllers: [DocumentsController, DocumentsDownloadController],
  providers: [DocumentsService, PrismaService]
})
export class DocumentsModule {}
