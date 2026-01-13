import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditModule } from "../audit/audit.module";
import { CasesController } from "./cases.controller";
import { CasesService } from "./cases.service";

@Module({
  imports: [AuditModule],
  controllers: [CasesController],
  providers: [CasesService, PrismaService],
  exports: [CasesService]
})
export class CasesModule {}
