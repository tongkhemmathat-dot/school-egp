-- Add lunch meta storage for egpeasy lunch flow
ALTER TABLE "ProcurementCase" ADD COLUMN "lunchMeta" JSONB;
