export type ApiUser = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

export type ProcurementCase = {
  id: string;
  orgId: string;
  title: string;
  caseType: string;
  status: string;
  isBackdated: boolean;
  documentNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentRecord[];
  auditLogs?: AuditLog[];
};

export type DocumentRecord = {
  id: string;
  orgId: string;
  caseId: string;
  templatePackId: string;
  fileName: string;
  filePath: string;
  generatedAt: string;
};

export type TemplatePack = {
  id: string;
  name_th: string;
  caseType: string;
  inputCells: { key: string; sheet: string; cell: string }[];
  outputSheets: string[];
  pdfMode: "perSheet" | "singlePdf";
};

export type AuditLog = {
  id: string;
  orgId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
};
