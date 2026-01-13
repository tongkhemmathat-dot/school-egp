export type ApiUser = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

export type User = ApiUser;

export type Vendor = {
  id: string;
  name: string;
};

export type CaseLine = {
  id?: string;
  description: string;
  itemId?: string | null;
  quantity: number;
  unitPrice: number;
  total?: number;
};

export type CaseApproval = {
  id: string;
  actorId: string;
  action: string;
  comment?: string | null;
  createdAt: string;
};

export type ProcurementCase = {
  id: string;
  orgId: string;
  title: string;
  reason?: string | null;
  caseType: string;
  subtype?: string | null;
  status: string;
  budgetAmount: number;
  fiscalYear: number;
  desiredDate?: string | null;
  vendorId?: string | null;
  vendor?: Vendor | null;
  isBackdated: boolean;
  backdateReason?: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: CaseLine[];
  approvals?: CaseApproval[];
  documents?: DocumentRecord[];
  auditLogs?: AuditLog[];
};

export type DocumentRecord = {
  id: string;
  orgId: string;
  caseId: string;
  templatePackId: string;
  documentType: string;
  fileType: "PDF" | "ZIP";
  fileName: string;
  filePath: string;
  runningNumber?: string | null;
  manualNumber?: string | null;
  documentDate?: string | null;
  generatedAt: string;
};

export type TemplatePack = {
  id: string;
  name_th: string;
  caseType: string;
  subtype?: string | null;
  inputCells: { key: string; sheet: string; cell: string }[];
  outputSheets: string[];
  pdfMode: "perSheet" | "singlePdf";
  isActive?: boolean;
};

export type AuditLog = {
  id: string;
  orgId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  caseId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
};

export type Unit = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  sku?: string | null;
  unitId: string;
  unit?: Unit;
  categoryId?: string | null;
  category?: Category | null;
};

export type Warehouse = {
  id: string;
  name: string;
  location?: string | null;
};

export type RequisitionLine = {
  id?: string;
  itemId: string;
  quantity: number;
  item?: Item;
};

export type MaterialRequisition = {
  id: string;
  requesterName: string;
  warehouseId: string;
  warehouse?: Warehouse;
  status: string;
  lines?: RequisitionLine[];
  createdAt: string;
};

export type StockCardRow = {
  id: string;
  transactionType: "IN" | "OUT";
  quantity: number;
  balance: number;
  referenceId?: string | null;
  createdAt: string;
};

export type Asset = {
  id: string;
  name: string;
  assetCode: string;
  acquisitionDate: string;
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  policy?: DepreciationPolicy;
  depreciationLines?: DepreciationLine[];
};

export type DepreciationPolicy = {
  id: string;
  name: string;
  method: string;
  isDefault: boolean;
};

export type DepreciationLine = {
  id: string;
  periodDate: string;
  amount: number;
  accumulated: number;
  bookValue: number;
};
