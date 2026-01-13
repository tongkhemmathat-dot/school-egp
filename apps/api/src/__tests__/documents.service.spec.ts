import { DocumentsService } from "../modules/documents/documents.service";

describe("DocumentsService running number", () => {
  it("increments running numbers per document type", async () => {
    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementationOnce(async (fn: any) =>
          fn({
            documentRunningNumber: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({
                id: "rn-1",
                orgId: "org-1",
                fiscalYear: 2567,
                documentType: "HIRE",
                sequence: 1
              })
            }
          })
        )
        .mockImplementationOnce(async (fn: any) =>
          fn({
            documentRunningNumber: {
              findUnique: jest.fn().mockResolvedValue({
                id: "rn-1",
                orgId: "org-1",
                fiscalYear: 2567,
                documentType: "HIRE",
                sequence: 1
              }),
              update: jest.fn().mockResolvedValue({
                id: "rn-1",
                orgId: "org-1",
                fiscalYear: 2567,
                documentType: "HIRE",
                sequence: 2
              })
            }
          })
        )
    } as any;
    const templates = {} as any;
    const audit = { record: jest.fn() } as any;
    const service = new DocumentsService(prisma, templates, audit);

    const first = await (service as any).nextRunningNumber("org-1", 2567, "HIRE", "user-1", {});
    const second = await (service as any).nextRunningNumber("org-1", 2567, "HIRE", "user-1", {});

    expect(first).toBe("HIRE-2567-0001");
    expect(second).toBe("HIRE-2567-0002");
    expect(audit.record).toHaveBeenCalledTimes(2);
  });
});
