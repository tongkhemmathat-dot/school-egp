import { z } from "zod";

export const CaseType = z.enum(["PURCHASE", "HIRE", "LUNCH", "INTERNET"]);
export type CaseType = z.infer<typeof CaseType>;

export const Role = z.enum(["Admin", "ProcurementOfficer", "Approver", "Viewer"]);
export type Role = z.infer<typeof Role>;

export const HireGeneralInputs = z.object({
  school_name: z.string().min(1),
  school_address: z.string().min(1),
  affiliation: z.string().min(1),
  officer_name: z.string().min(1),
  head_officer_name: z.string().min(1),
  finance_officer_name: z.string().min(1),
  director_name: z.string().min(1),
  memo_no: z.string().min(1),
  memo_date_day: z.string().min(1),
  memo_date_month: z.string().min(1),
  memo_date_year: z.string().min(1),
  project_code: z.string().min(1),
  contractor_code: z.string().min(1),
  work_order_no: z.string().min(1),
  work_order_date_day: z.string().min(1),
  work_order_date_month: z.string().min(1),
  work_order_date_year: z.string().min(1),
  delivery_note_no: z.string().min(1),
  delivery_note_date_day: z.string().min(1),
  delivery_note_date_month: z.string().min(1),
  delivery_note_date_year: z.string().min(1),
  inspection_date_day: z.string().min(1),
  inspection_date_month: z.string().min(1),
  inspection_date_year: z.string().min(1),
  payment_memo_no: z.string().min(1),
  payment_request_date_day: z.string().min(1),
  payment_request_date_month: z.string().min(1),
  payment_request_date_year: z.string().min(1)
});
export type HireGeneralInputs = z.infer<typeof HireGeneralInputs>;

export const DocumentPackRequest = z.object({
  caseId: z.string().uuid(),
  packId: z.string().min(1)
});
export type DocumentPackRequest = z.infer<typeof DocumentPackRequest>;
