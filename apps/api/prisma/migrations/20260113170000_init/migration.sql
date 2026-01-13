-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE "Role" AS ENUM ('Admin', 'ProcurementOfficer', 'Approver', 'Viewer');
CREATE TYPE "CaseType" AS ENUM ('PURCHASE', 'HIRE', 'LUNCH', 'INTERNET');
CREATE TYPE "CaseSubtype" AS ENUM ('PREPARED', 'INGREDIENTS', 'INGREDIENTS_COOK', 'LEASE', 'PURCHASE');
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT');
CREATE TYPE "StockTransactionType" AS ENUM ('IN', 'OUT');
CREATE TYPE "DocumentFileType" AS ENUM ('PDF', 'ZIP');
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'GENERATE', 'APPROVE', 'SUBMIT', 'REJECT', 'OVERRIDE');

-- Create tables
CREATE TABLE "Organization" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Vendor" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "taxId" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Item" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "unitId" UUID NOT NULL,
  "categoryId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warehouse" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockTransaction" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "itemId" UUID NOT NULL,
  "warehouseId" UUID NOT NULL,
  "transactionType" "StockTransactionType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialRequisition" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "requesterId" UUID,
  "requesterName" TEXT NOT NULL,
  "warehouseId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaterialRequisition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialRequisitionLine" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "requisitionId" UUID NOT NULL,
  "itemId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "MaterialRequisitionLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DepreciationPolicy" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "method" "DepreciationMethod" NOT NULL DEFAULT 'STRAIGHT_LINE',
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepreciationPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Asset" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "assetCode" TEXT NOT NULL,
  "acquisitionDate" TIMESTAMP(3) NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL,
  "salvageValue" DOUBLE PRECISION NOT NULL,
  "usefulLifeMonths" INTEGER NOT NULL,
  "policyId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DepreciationLine" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL,
  "periodDate" TIMESTAMP(3) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "accumulated" DOUBLE PRECISION NOT NULL,
  "bookValue" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "DepreciationLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcurementCase" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT,
  "caseType" "CaseType" NOT NULL,
  "subtype" "CaseSubtype",
  "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
  "budgetAmount" DOUBLE PRECISION NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "desiredDate" TIMESTAMP(3),
  "vendorId" UUID,
  "isBackdated" BOOLEAN NOT NULL DEFAULT FALSE,
  "backdateReason" TEXT,
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaseLine" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "caseId" UUID NOT NULL,
  "description" TEXT NOT NULL,
  "itemId" UUID,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "CaseLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaseApproval" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "caseId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "action" "ApprovalAction" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaseApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "caseId" UUID NOT NULL,
  "templatePackId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileType" "DocumentFileType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "runningNumber" TEXT,
  "manualNumber" TEXT,
  "documentDate" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentRunningNumber" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "documentType" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentRunningNumber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentRunningNumber_unique" ON "DocumentRunningNumber"("orgId", "fiscalYear", "documentType");

CREATE TABLE "TemplatePack" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "packId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "caseType" "CaseType" NOT NULL,
  "subtype" "CaseSubtype",
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplatePack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "userId" UUID,
  "action" "AuditAction" NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "caseId" UUID,
  "before" JSONB,
  "after" JSONB,
  "reason" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialRequisition" ADD CONSTRAINT "MaterialRequisition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialRequisition" ADD CONSTRAINT "MaterialRequisition_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialRequisitionLine" ADD CONSTRAINT "MaterialRequisitionLine_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "MaterialRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialRequisitionLine" ADD CONSTRAINT "MaterialRequisitionLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepreciationPolicy" ADD CONSTRAINT "DepreciationPolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "DepreciationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepreciationLine" ADD CONSTRAINT "DepreciationLine_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementCase" ADD CONSTRAINT "ProcurementCase_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementCase" ADD CONSTRAINT "ProcurementCase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CaseLine" ADD CONSTRAINT "CaseLine_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CaseLine" ADD CONSTRAINT "CaseLine_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseLine" ADD CONSTRAINT "CaseLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CaseApproval" ADD CONSTRAINT "CaseApproval_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRunningNumber" ADD CONSTRAINT "DocumentRunningNumber_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TemplatePack" ADD CONSTRAINT "TemplatePack_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
