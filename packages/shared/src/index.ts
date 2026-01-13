import { z } from "zod";

export const Role = z.enum(["Admin", "ProcurementOfficer", "Approver", "Viewer"]);
export type Role = z.infer<typeof Role>;

export const CaseType = z.enum(["PURCHASE", "HIRE", "LUNCH", "INTERNET"]);
export type CaseType = z.infer<typeof CaseType>;

export const CaseSubtype = z.enum([
  "PREPARED",
  "INGREDIENTS",
  "INGREDIENTS_COOK",
  "LEASE",
  "PURCHASE"
]);
export type CaseSubtype = z.infer<typeof CaseSubtype>;

export const CaseStatus = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"]);
export type CaseStatus = z.infer<typeof CaseStatus>;

export const ApprovalAction = z.enum(["SUBMIT", "APPROVE", "REJECT"]);
export type ApprovalAction = z.infer<typeof ApprovalAction>;

export const DocumentFileType = z.enum(["PDF", "ZIP"]);
export type DocumentFileType = z.infer<typeof DocumentFileType>;

export const AuditAction = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "GENERATE",
  "APPROVE",
  "SUBMIT",
  "REJECT",
  "OVERRIDE"
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  affiliation: z.string().optional().nullable(),
  studentCount: z.number().int().optional().nullable(),
  officerName: z.string().optional().nullable(),
  headOfficerName: z.string().optional().nullable(),
  financeOfficerName: z.string().optional().nullable(),
  directorName: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional()
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: Role,
  createdAt: z.string().datetime().optional()
});
export type User = z.infer<typeof UserSchema>;

export const VendorSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  code: z.string().optional().nullable(),
  name: z.string().min(1),
  taxId: z.string().optional().nullable(),
  citizenId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankBranch: z.string().optional().nullable()
});
export type Vendor = z.infer<typeof VendorSchema>;

export const UnitSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1)
});
export type Unit = z.infer<typeof UnitSchema>;

export const CategorySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1)
});
export type Category = z.infer<typeof CategorySchema>;

export const WarehouseSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  location: z.string().optional().nullable()
});
export type Warehouse = z.infer<typeof WarehouseSchema>;

export const ItemSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  unitId: z.string().uuid(),
  categoryId: z.string().uuid().optional().nullable()
});
export type Item = z.infer<typeof ItemSchema>;

export const CaseLineSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  description: z.string().min(1),
  itemId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative()
});
export type CaseLine = z.infer<typeof CaseLineSchema>;

export const ProcurementCaseSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  title: z.string().min(1),
  reason: z.string().optional().nullable(),
  caseType: CaseType,
  subtype: CaseSubtype.optional().nullable(),
  status: CaseStatus,
  budgetAmount: z.number().nonnegative(),
  fiscalYear: z.number().int(),
  desiredDate: z.string().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  isBackdated: z.boolean(),
  backdateReason: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});
export type ProcurementCase = z.infer<typeof ProcurementCaseSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  caseId: z.string().uuid(),
  templatePackId: z.string().min(1),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileType: DocumentFileType,
  documentType: z.string().min(1),
  runningNumber: z.string().optional().nullable(),
  manualNumber: z.string().optional().nullable(),
  documentDate: z.string().optional().nullable(),
  generatedAt: z.string().datetime()
});
export type Document = z.infer<typeof DocumentSchema>;

export const TemplatePackSchema = z.object({
  id: z.string().min(1),
  name_th: z.string().min(1),
  caseType: CaseType,
  subtype: CaseSubtype.optional().nullable(),
  inputCells: z.array(z.object({ key: z.string(), sheet: z.string(), cell: z.string() })),
  outputSheets: z.array(z.string()),
  pdfMode: z.enum(["perSheet", "singlePdf"]),
  isActive: z.boolean().optional()
});
export type TemplatePack = z.infer<typeof TemplatePackSchema>;

export const MaterialRequisitionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  requesterId: z.string().uuid().optional().nullable(),
  requesterName: z.string().min(1),
  warehouseId: z.string().uuid(),
  status: z.enum(["DRAFT", "ISSUED"]),
  createdAt: z.string().datetime().optional()
});
export type MaterialRequisition = z.infer<typeof MaterialRequisitionSchema>;

export const MaterialRequisitionLineSchema = z.object({
  id: z.string().uuid(),
  requisitionId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().positive()
});
export type MaterialRequisitionLine = z.infer<typeof MaterialRequisitionLineSchema>;

export const AssetSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  assetCode: z.string().min(1),
  acquisitionDate: z.string(),
  cost: z.number().nonnegative(),
  salvageValue: z.number().nonnegative(),
  usefulLifeMonths: z.number().int().positive(),
  policyId: z.string().uuid(),
  createdAt: z.string().datetime().optional()
});
export type Asset = z.infer<typeof AssetSchema>;

export const DepreciationPolicySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  method: z.enum(["STRAIGHT_LINE"]),
  isDefault: z.boolean()
});
export type DepreciationPolicy = z.infer<typeof DepreciationPolicySchema>;

export const DepreciationLineSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  periodDate: z.string(),
  amount: z.number().nonnegative(),
  accumulated: z.number().nonnegative(),
  bookValue: z.number().nonnegative()
});
export type DepreciationLine = z.infer<typeof DepreciationLineSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  affiliation: z.string().optional().nullable(),
  studentCount: z.number().int().optional().nullable(),
  officerName: z.string().optional().nullable(),
  headOfficerName: z.string().optional().nullable(),
  financeOfficerName: z.string().optional().nullable(),
  directorName: z.string().optional().nullable()
});
export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: Role
});
export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: Role.optional()
});

export const CreateVendorSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1),
  taxId: z.string().optional().nullable(),
  citizenId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankAccountName: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankBranch: z.string().optional().nullable()
});
export const UpdateVendorSchema = CreateVendorSchema.partial();

export const CreateUnitSchema = z.object({ name: z.string().min(1) });
export const UpdateUnitSchema = CreateUnitSchema.partial();

export const CreateCategorySchema = z.object({ name: z.string().min(1) });
export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional().nullable()
});
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();

export const CreateItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  unitId: z.string().uuid(),
  categoryId: z.string().uuid().optional().nullable()
});
export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateCaseSchema = z.object({
  title: z.string().min(1),
  reason: z.string().optional().nullable(),
  caseType: CaseType,
  subtype: CaseSubtype.optional().nullable(),
  budgetAmount: z.number().nonnegative(),
  fiscalYear: z.number().int(),
  desiredDate: z.string().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  isBackdated: z.boolean(),
  backdateReason: z.string().optional().nullable(),
  lines: z.array(
    z.object({
      description: z.string().min(1),
      itemId: z.string().uuid().optional().nullable(),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative()
    })
  )
});

export const UpdateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  reason: z.string().optional().nullable(),
  status: CaseStatus.optional(),
  budgetAmount: z.number().nonnegative().optional(),
  desiredDate: z.string().optional().nullable(),
  vendorId: z.string().uuid().optional().nullable(),
  isBackdated: z.boolean().optional(),
  backdateReason: z.string().optional().nullable()
});

export const SubmitApprovalSchema = z.object({
  action: ApprovalAction,
  comment: z.string().optional().nullable()
});

export const CreateRequisitionSchema = z.object({
  requesterName: z.string().min(1),
  warehouseId: z.string().uuid(),
  lines: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.number().positive()
    })
  )
});

export const UpdateRequisitionSchema = z.object({
  requesterName: z.string().min(1).optional(),
  warehouseId: z.string().uuid().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive()
      })
    )
    .optional()
});

export const CreateAssetSchema = z.object({
  name: z.string().min(1),
  assetCode: z.string().min(1),
  acquisitionDate: z.string().min(1),
  cost: z.number().nonnegative(),
  salvageValue: z.number().nonnegative(),
  usefulLifeMonths: z.number().int().positive(),
  policyId: z.string().uuid()
});

export const UpdateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  assetCode: z.string().min(1).optional(),
  acquisitionDate: z.string().min(1).optional(),
  cost: z.number().nonnegative().optional(),
  salvageValue: z.number().nonnegative().optional(),
  usefulLifeMonths: z.number().int().positive().optional(),
  policyId: z.string().uuid().optional()
});

export const CreateDepreciationPolicySchema = z.object({
  name: z.string().min(1),
  method: z.enum(["STRAIGHT_LINE"]).default("STRAIGHT_LINE"),
  isDefault: z.boolean().optional()
});

export const UpdateDepreciationPolicySchema = z.object({
  name: z.string().min(1).optional(),
  method: z.enum(["STRAIGHT_LINE"]).optional(),
  isDefault: z.boolean().optional()
});

export const GenerateDocumentSchema = z.object({
  packId: z.string().min(1),
  inputs: z.record(z.string()),
  pdfMode: z.enum(["perSheet", "singlePdf"]).optional()
});

export const OverrideDocumentNumberSchema = z.object({
  documentId: z.string().uuid(),
  number: z.string().min(1),
  reason: z.string().min(1),
  documentDate: z.string().optional()
});

export const UpdateTemplatePackSchema = z.object({
  isActive: z.boolean()
});

export const ApiErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({ path: z.array(z.string()), message: z.string() })).optional()
});

export const Permissions = {
  Admin: [
    "admin:manage",
    "cases:manage",
    "inventory:manage",
    "assets:manage",
    "reports:view"
  ],
  ProcurementOfficer: ["cases:manage", "inventory:manage", "assets:manage", "reports:view"],
  Approver: ["cases:approve", "reports:view"],
  Viewer: ["reports:view"]
} as const;
