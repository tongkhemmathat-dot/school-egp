import { BadRequestException } from "@nestjs/common";
import { CasesService } from "../modules/cases/cases.service";

describe("CasesService", () => {
  it("rejects backdated cases without reason", async () => {
    const prisma = {
      $transaction: jest.fn()
    } as any;
    const audit = { record: jest.fn() } as any;
    const service = new CasesService(prisma, audit);

    await expect(
      service.create(
        "org-1",
        "user-1",
        {
          title: "Backdated",
          caseType: "HIRE",
          budgetAmount: 1000,
          fiscalYear: 2567,
          isBackdated: true,
          lines: []
        } as any,
        {}
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects lunch cases without subtype", async () => {
    const prisma = {
      $transaction: jest.fn()
    } as any;
    const audit = { record: jest.fn() } as any;
    const service = new CasesService(prisma, audit);

    await expect(
      service.create(
        "org-1",
        "user-1",
        {
          title: "Lunch",
          caseType: "LUNCH",
          budgetAmount: 2000,
          fiscalYear: 2567,
          isBackdated: false,
          lines: []
        } as any,
        {}
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates case and records audit", async () => {
    const tx = {
      procurementCase: {
        create: jest.fn().mockResolvedValue({ id: "case-1", orgId: "org-1", title: "Case" })
      },
      caseLine: {
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    };
    const prisma = {
      $transaction: jest.fn(async (fn: any) => fn(tx))
    } as any;
    const audit = { record: jest.fn() } as any;
    const service = new CasesService(prisma, audit);

    const result = await service.create(
      "org-1",
      "user-1",
      {
        title: "Case",
        caseType: "HIRE",
        budgetAmount: 1000,
        fiscalYear: 2567,
        isBackdated: false,
        lines: [{ description: "Service", quantity: 1, unitPrice: 1000 }]
      } as any,
      {}
    );

    expect(result.id).toBe("case-1");
    expect(audit.record).toHaveBeenCalled();
  });
});
