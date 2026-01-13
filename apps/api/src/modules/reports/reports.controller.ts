import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import ExcelJS from "exceljs";
import { PrismaService } from "../../prisma/prisma.service";
import { Roles, RolesGuard } from "../auth/roles.guard";

@Controller("reports")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("procurement-register")
  @Roles("Admin", "ProcurementOfficer", "Approver", "Viewer")
  async procurementRegister(@Req() req: any, @Res() res: Response, @Query("q") q?: string) {
    const cases = await this.prisma.procurementCase.findMany({
      where: {
        orgId: req.user.orgId,
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {})
      },
      orderBy: { createdAt: "desc" }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Procurement Register");
    sheet.addRow(["Case ID", "Title", "Type", "Status", "Created At"]);
    cases.forEach((caseItem) => {
      sheet.addRow([caseItem.id, caseItem.title, caseItem.caseType, caseItem.status, caseItem.createdAt]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=procurement-register.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  }
}
