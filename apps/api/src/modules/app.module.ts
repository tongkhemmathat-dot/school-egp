import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AuthModule } from "./auth/auth.module";
import { CasesModule } from "./cases/cases.module";
import { DocumentsModule } from "./documents/documents.module";
import { ReportsModule } from "./reports/reports.module";
import { TemplatesModule } from "./templates/templates.module";
import { AuditModule } from "./audit/audit.module";
import { InventoryModule } from "./inventory/inventory.module";
import { AssetsModule } from "./assets/assets.module";
import { OrganizationsModule } from "./organizations/organizations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CasesModule,
    DocumentsModule,
    ReportsModule,
    TemplatesModule,
    AuditModule,
    InventoryModule,
    AssetsModule,
    OrganizationsModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
