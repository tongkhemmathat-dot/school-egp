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
  async procurementRegister(
    @Req() req: any,
    @Res() res: Response,
    @Query("q") q?: string,
    @Query("caseType") caseType?: string,
    @Query("vendorId") vendorId?: string,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("fiscalYear") fiscalYear?: string
  ) {
    const cases = await this.prisma.procurementCase.findMany({
      where: {
        orgId: req.user.orgId,
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(caseType ? { caseType: caseType as any } : {}),
        ...(vendorId ? { vendorId } : {}),
        ...(status ? { status: status as any } : {}),
        ...(fiscalYear ? { fiscalYear: Number(fiscalYear) } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {})
              }
            }
          : {})
      },
      include: { vendor: true, documents: true },
      orderBy: { createdAt: "desc" }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Procurement Register");
    sheet.addRow([
      "Case ID",
      "Title",
      "Type",
      "Subtype",
      "Vendor",
      "Amount",
      "Fiscal Year",
      "Status",
      "Document Numbers",
      "Created At"
    ]);
    cases.forEach((caseItem) => {
      const docNumbers = caseItem.documents
        .map((doc) => doc.manualNumber || doc.runningNumber || "")
        .filter(Boolean)
        .join(", ");
      sheet.addRow([
        caseItem.id,
        caseItem.title,
        caseItem.caseType,
        caseItem.subtype || "",
        caseItem.vendor?.name || "",
        caseItem.budgetAmount,
        caseItem.fiscalYear,
        caseItem.status,
        docNumbers,
        caseItem.createdAt.toISOString().slice(0, 10)
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=procurement-register.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  }
}
