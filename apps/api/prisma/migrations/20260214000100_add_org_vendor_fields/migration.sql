ALTER TABLE "Organization"
ADD COLUMN "address" TEXT,
ADD COLUMN "affiliation" TEXT,
ADD COLUMN "studentCount" INTEGER,
ADD COLUMN "officerName" TEXT,
ADD COLUMN "headOfficerName" TEXT,
ADD COLUMN "financeOfficerName" TEXT,
ADD COLUMN "directorName" TEXT;

ALTER TABLE "Vendor"
ADD COLUMN "code" TEXT,
ADD COLUMN "citizenId" TEXT,
ADD COLUMN "bankAccount" TEXT,
ADD COLUMN "bankAccountName" TEXT,
ADD COLUMN "bankName" TEXT,
ADD COLUMN "bankBranch" TEXT;
