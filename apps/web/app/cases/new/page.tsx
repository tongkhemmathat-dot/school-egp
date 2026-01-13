"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import type { Item, ProcurementCase, Vendor } from "../../../lib/types";

type CaseLineInput = {
  description: string;
  itemId?: string | null;
  quantity: number;
  unitPrice: number;
};

const caseTypeOptions = [
  { value: "HIRE", label: "จัดจ้าง" },
  { value: "PURCHASE", label: "จัดซื้อ" },
  { value: "LUNCH", label: "อาหารกลางวัน" },
  { value: "INTERNET", label: "อินเทอร์เน็ต" }
];

const lunchSubtypes = [
  { value: "PREPARED", label: "จ้างเหมาปรุงสำเร็จ" },
  { value: "INGREDIENTS", label: "ซื้อวัตถุดิบ" },
  { value: "INGREDIENTS_COOK", label: "ซื้อวัตถุดิบ + จ้างแม่ครัว" }
];

const internetSubtypes = [
  { value: "LEASE", label: "เช่าอินเทอร์เน็ต" },
  { value: "PURCHASE", label: "ซื้ออินเทอร์เน็ต" }
];

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({
    title: "",
    reason: "",
    caseType: "HIRE",
    subtype: "",
    fiscalYear: new Date().getFullYear(),
    desiredDate: "",
    vendorId: "",
    isBackdated: false,
    backdateReason: ""
  });
  const [lines, setLines] = useState<CaseLineInput[]>([
    { description: "", itemId: null, quantity: 1, unitPrice: 0 }
  ]);
  const [submitNow, setSubmitNow] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([apiFetch<Item[]>("admin/items"), apiFetch<Vendor[]>("admin/vendors")])
      .then(([itemData, vendorData]) => {
        if (!active) return;
        setItems(itemData);
        setVendors(vendorData);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const totalBudget = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [lines]
  );

  const subtypeOptions = useMemo(() => {
    if (form.caseType === "LUNCH") return lunchSubtypes;
    if (form.caseType === "INTERNET") return internetSubtypes;
    return [];
  }, [form.caseType]);

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!form.title.trim()) return "กรุณาระบุชื่อโครงการ";
      if ((form.caseType === "LUNCH" || form.caseType === "INTERNET") && !form.subtype) {
        return "กรุณาเลือกประเภทงานย่อย";
      }
      if (form.isBackdated && !form.backdateReason.trim()) {
        return "กรุณาระบุเหตุผลการย้อนหลัง";
      }
    }
    if (currentStep === 2) {
      if (lines.length === 0 || lines.some((line) => !line.description.trim())) {
        return "กรุณาระบุรายการอย่างน้อย 1 รายการ";
      }
    }
    return null;
  };

  const handleNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        reason: form.reason || null,
        caseType: form.caseType,
        subtype: form.subtype || null,
        budgetAmount: totalBudget,
        fiscalYear: Number(form.fiscalYear),
        desiredDate: form.desiredDate || null,
        vendorId: form.vendorId || null,
        isBackdated: form.isBackdated,
        backdateReason: form.isBackdated ? form.backdateReason : null,
        lines: lines.map((line) => ({
          description: line.description,
          itemId: line.itemId || null,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice)
        }))
      };
      const created = await apiFetch<ProcurementCase>("cases", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (submitNow) {
        await apiFetch(`cases/${created.id}/approvals`, {
          method: "POST",
          body: JSON.stringify({ action: "SUBMIT", comment: approvalComment || null })
        });
      }
      router.push(`/cases/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold">Create Procurement Case</h2>
      <div className="mt-4 flex gap-2 text-sm text-slate-500">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className={`rounded-full px-3 py-1 ${
              step === item ? "bg-blue-600 text-white" : "bg-slate-100"
            }`}
          >
            Step {item}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Case Title</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="จัดจ้างทั่วไป"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Reason</label>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Case Type</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.caseType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, caseType: event.target.value, subtype: "" }))
                }
              >
                {caseTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Subtype</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.subtype}
                onChange={(event) => setForm((prev) => ({ ...prev, subtype: event.target.value }))}
                disabled={subtypeOptions.length === 0}
              >
                <option value="">-</option>
                {subtypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Fiscal Year</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                type="number"
                value={form.fiscalYear}
                onChange={(event) => setForm((prev) => ({ ...prev, fiscalYear: Number(event.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Desired Date</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                type="date"
                value={form.desiredDate}
                onChange={(event) => setForm((prev) => ({ ...prev, desiredDate: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Backdated Case</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.isBackdated ? "true" : "false"}
                onChange={(event) => setForm((prev) => ({ ...prev, isBackdated: event.target.value === "true" }))}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            {form.isBackdated ? (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Backdate Reason</label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.backdateReason}
                  onChange={(event) => setForm((prev) => ({ ...prev, backdateReason: event.target.value }))}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lines</h3>
              <button
                className="rounded border px-3 py-2 text-sm"
                type="button"
                onClick={() =>
                  setLines((prev) => [...prev, { description: "", itemId: null, quantity: 1, unitPrice: 0 }])
                }
              >
                Add Line
              </button>
            </div>
            {lines.map((line, index) => (
              <div key={`line-${index}`} className="rounded border p-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={line.description}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, description: event.target.value } : item
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Item</label>
                    <select
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={line.itemId || ""}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, itemId: event.target.value || null } : item
                          )
                        )
                      }
                    >
                      <option value="">-</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      type="number"
                      min={0}
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, quantity: Number(event.target.value) } : item
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Price</label>
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      type="number"
                      min={0}
                      value={line.unitPrice}
                      onChange={(event) =>
                        setLines((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, unitPrice: Number(event.target.value) } : item
                          )
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-4 flex items-center justify-between text-sm text-slate-500">
                    <span>Line Total: {(line.quantity * line.unitPrice).toLocaleString()}</span>
                    <button
                      className="text-red-600"
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-right text-sm text-slate-600">
              Total Budget: <span className="font-semibold">{totalBudget.toLocaleString()}</span>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Vendor</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.vendorId}
                onChange={(event) => setForm((prev) => ({ ...prev, vendorId: event.target.value }))}
              >
                <option value="">-</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Budget Amount (auto)</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={totalBudget.toLocaleString()}
                readOnly
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={submitNow}
                onChange={(event) => setSubmitNow(event.target.checked)}
              />
              <label className="text-sm font-medium">Submit for approval after creation</label>
            </div>
            {submitNow ? (
              <div>
                <label className="text-sm font-medium">Approval Comment</label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={approvalComment}
                  onChange={(event) => setApprovalComment(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-2 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-800">Title:</span> {form.title}
            </div>
            <div>
              <span className="font-medium text-slate-800">Type:</span> {form.caseType}
            </div>
            <div>
              <span className="font-medium text-slate-800">Subtype:</span> {form.subtype || "-"}
            </div>
            <div>
              <span className="font-medium text-slate-800">Budget:</span> {totalBudget.toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-slate-800">Vendor:</span>{" "}
              {vendors.find((vendor) => vendor.id === form.vendorId)?.name || "-"}
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex items-center justify-between">
          <button className="rounded border px-4 py-2" type="button" onClick={handlePrev} disabled={step === 1}>
            Back
          </button>
          {step < 5 ? (
            <button className="rounded bg-blue-600 px-4 py-2 text-white" type="button" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={handleCreate}
            >
              {loading ? "Creating..." : "Create Case"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
