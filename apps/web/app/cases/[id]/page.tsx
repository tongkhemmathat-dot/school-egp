"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, getApiBase } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type {
  AuditLog,
  DocumentRecord,
  Item,
  ProcurementCase,
  TemplatePack,
  Vendor
} from "../../../lib/types";

type CaseLineInput = {
  description: string;
  itemId?: string | null;
  quantity: number;
  unitPrice: number;
};

const tabs = ["summary", "lines", "documents", "approvals", "audit"] as const;

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = typeof params?.id === "string" ? params.id : params?.id?.[0] || "";
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<ProcurementCase | null>(null);
  const [templates, setTemplates] = useState<TemplatePack[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("summary");
  const [summaryForm, setSummaryForm] = useState({
    title: "",
    reason: "",
    budgetAmount: 0,
    desiredDate: "",
    vendorId: "",
    isBackdated: false,
    backdateReason: "",
    status: "DRAFT"
  });
  const [linesForm, setLinesForm] = useState<CaseLineInput[]>([]);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [pdfMode, setPdfMode] = useState<"perSheet" | "singlePdf">("singlePdf");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [approvalComment, setApprovalComment] = useState("");
  const [overrideForm, setOverrideForm] = useState({
    documentId: "",
    number: "",
    reason: "",
    documentDate: ""
  });
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setActionError(null);
    try {
      const canManage = user?.role === "Admin" || user?.role === "ProcurementOfficer";
      const [caseResponse, templateResponse, itemResponse, vendorResponse] = await Promise.all([
        apiFetch<ProcurementCase>(`cases/${caseId}`),
        apiFetch<TemplatePack[]>("templates"),
        canManage ? apiFetch<Item[]>("admin/items") : Promise.resolve([] as Item[]),
        canManage ? apiFetch<Vendor[]>("admin/vendors") : Promise.resolve([] as Vendor[])
      ]);
      setCaseData(caseResponse);
      setTemplates(templateResponse);
      setItems(itemResponse);
      setVendors(vendorResponse);
      try {
        const auditResponse = await apiFetch<AuditLog[]>(`audit?caseId=${caseId}`);
        setAuditLogs(auditResponse);
      } catch {
        setAuditLogs([]);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [caseId, user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!caseData) return;
      setSummaryForm({
        title: caseData.title,
        reason: caseData.reason || "",
        budgetAmount: caseData.budgetAmount,
        desiredDate: caseData.desiredDate ? caseData.desiredDate.slice(0, 10) : "",
        vendorId: caseData.vendorId || "",
        isBackdated: caseData.isBackdated,
        backdateReason: caseData.backdateReason || "",
        status: caseData.status
      });
    setLinesForm(
      (caseData.lines || []).map((line) => ({
        description: line.description,
        itemId: line.itemId || null,
        quantity: line.quantity,
        unitPrice: line.unitPrice
      }))
    );
  }, [caseData]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!caseData || templates.length === 0) return;
    if (selectedPackId) return;
    const match =
      templates.find((pack) => pack.caseType === caseData.caseType && (!pack.subtype || pack.subtype === caseData.subtype)) ||
      templates.find((pack) => pack.caseType === caseData.caseType) ||
      templates[0];
    if (match) {
      setSelectedPackId(match.id);
      setPdfMode(match.pdfMode);
      setInputs(
        match.inputCells.reduce<Record<string, string>>((acc, cell) => {
          acc[cell.key] = "";
          return acc;
        }, {})
      );
    }
  }, [caseData, templates, selectedPackId]);

  const selectedPack = useMemo(
    () => templates.find((pack) => pack.id === selectedPackId),
    [templates, selectedPackId]
  );

  const documents = (caseData?.documents || []) as DocumentRecord[];
  const lunchMeta = caseData?.lunchMeta || null;
  const canManage = user?.role === "Admin" || user?.role === "ProcurementOfficer";
  const canApprove = user?.role === "Admin" || user?.role === "Approver";

  const handleSaveSummary = async () => {
    if (!caseId) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: summaryForm.title,
          reason: summaryForm.reason || null,
          budgetAmount: Number(summaryForm.budgetAmount),
          desiredDate: summaryForm.desiredDate || null,
          vendorId: summaryForm.vendorId || null,
          status: summaryForm.status,
          isBackdated: summaryForm.isBackdated,
          backdateReason: summaryForm.isBackdated ? summaryForm.backdateReason : null
        })
      });
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update case");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLines = async () => {
    if (!caseId) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}/lines`, {
        method: "PUT",
        body: JSON.stringify({
          lines: linesForm.map((line) => ({
            description: line.description,
            itemId: line.itemId || null,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice)
          }))
        })
      });
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update lines");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPack || !caseId) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}/documents/generate`, {
        method: "POST",
        body: JSON.stringify({ packId: selectedPack.id, inputs, pdfMode })
      });
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate documents");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    const apiBase = getApiBase();
    const apiResponse = await fetch(
      `${apiBase}/documents/${docId}/download`,
      {
        credentials: "include"
      }
    );
    if (!apiResponse.ok) {
      setActionError("Failed to download document");
      return;
    }
    const blob = await apiResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (!caseId) return;
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/cases/${caseId}/documents/download-zip`, {
      credentials: "include"
    });
    if (!response.ok) {
      setActionError("Failed to download ZIP");
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `case-${caseId}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const applyLunchInputs = useCallback(() => {
    if (!selectedPack || !lunchMeta) return;
    const nextInputs = selectedPack.inputCells.reduce<Record<string, string>>((acc, cell) => {
      const value = lunchMeta[cell.key];
      acc[cell.key] = value ?? "";
      return acc;
    }, {});
    setInputs(nextInputs);
  }, [lunchMeta, selectedPack]);

  useEffect(() => {
    if (!selectedPack || !lunchMeta) return;
    const hasValues = Object.values(inputs).some((value) => value && value.trim() !== "");
    if (!hasValues) {
      applyLunchInputs();
    }
  }, [selectedPack, lunchMeta, inputs, applyLunchInputs]);

  const handlePreview = async (doc: DocumentRecord) => {
    if (doc.fileType !== "PDF") {
      setActionError("เอกสารนี้ไม่รองรับการแสดงผลในเว็บ");
      return;
    }
    setPreviewLoading(true);
    setActionError(null);
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/documents/${doc.id}/download`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to load document");
      }
      const blob = await response.blob();
      const nextUrl = window.URL.createObjectURL(blob);
      setPreviewDoc(doc);
      setPreviewUrl((prev) => {
        if (prev) {
          window.URL.revokeObjectURL(prev);
        }
        return nextUrl;
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ไม่สามารถแสดงเอกสารได้");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApproval = async (action: "SUBMIT" | "APPROVE" | "REJECT") => {
    if (!caseId) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}/approvals`, {
        method: "POST",
        body: JSON.stringify({ action, comment: approvalComment || null })
      });
      setApprovalComment("");
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update approval");
    } finally {
      setSaving(false);
    }
  };

  const handleOverrideNumber = async () => {
    if (!caseId || !overrideForm.documentId) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}/documents/override-number`, {
        method: "POST",
        body: JSON.stringify({
          documentId: overrideForm.documentId,
          number: overrideForm.number,
          reason: overrideForm.reason,
          documentDate: overrideForm.documentDate || null
        })
      });
      setOverrideForm({ documentId: "", number: "", reason: "", documentDate: "" });
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to override document number");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading case...</p>;
  }

  if (!caseData) {
    return <p className="text-sm text-red-600">Case not found.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Case {caseData.id}</h2>
      <p className="mt-1 text-sm text-slate-500">{caseData.title}</p>
      <div className="mt-4 flex gap-2 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`rounded px-3 py-1 ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      {actionError ? <p className="mt-4 text-sm text-red-600">{actionError}</p> : null}

      {activeTab === "summary" ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <fieldset disabled={!canManage}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={summaryForm.title}
                  onChange={(event) => setSummaryForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={summaryForm.reason}
                  onChange={(event) => setSummaryForm((prev) => ({ ...prev, reason: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Case Type</label>
                <input className="mt-1 w-full rounded border px-3 py-2" value={caseData.caseType} readOnly />
              </div>
              <div>
                <label className="text-sm font-medium">Subtype</label>
                <input className="mt-1 w-full rounded border px-3 py-2" value={caseData.subtype || "-"} readOnly />
              </div>
              <div>
                <label className="text-sm font-medium">Budget Amount</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  type="number"
                  value={summaryForm.budgetAmount}
                  onChange={(event) =>
                    setSummaryForm((prev) => ({ ...prev, budgetAmount: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Desired Date</label>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  type="date"
                  value={summaryForm.desiredDate}
                  onChange={(event) => setSummaryForm((prev) => ({ ...prev, desiredDate: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vendor</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={summaryForm.vendorId}
                  onChange={(event) => setSummaryForm((prev) => ({ ...prev, vendorId: event.target.value }))}
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
                <label className="text-sm font-medium">Status</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={summaryForm.status}
                  onChange={(event) => setSummaryForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  {["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Backdated</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={summaryForm.isBackdated ? "true" : "false"}
                  onChange={(event) =>
                    setSummaryForm((prev) => ({ ...prev, isBackdated: event.target.value === "true" }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              {summaryForm.isBackdated ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Backdate Reason</label>
                  <textarea
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={summaryForm.backdateReason}
                    onChange={(event) => setSummaryForm((prev) => ({ ...prev, backdateReason: event.target.value }))}
                  />
                </div>
              ) : null}
            </div>
          </fieldset>
          {canManage ? (
            <button
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={saving}
              onClick={handleSaveSummary}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          ) : null}
        </div>
      ) : null}

      {activeTab === "lines" ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lines</h3>
            <button
              className="rounded border px-3 py-2 text-sm"
              type="button"
              disabled={!canManage}
              onClick={() =>
                setLinesForm((prev) => [...prev, { description: "", itemId: null, quantity: 1, unitPrice: 0 }])
              }
            >
              Add Line
            </button>
          </div>
          <fieldset className="mt-4 space-y-3" disabled={!canManage}>
            {linesForm.map((line, index) => (
              <div key={`line-${index}`} className="rounded border p-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={line.description}
                      onChange={(event) =>
                        setLinesForm((prev) =>
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
                        setLinesForm((prev) =>
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
                        setLinesForm((prev) =>
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
                        setLinesForm((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, unitPrice: Number(event.target.value) } : item
                          )
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-4 flex items-center justify-between text-sm text-slate-500">
                    <span>Line Total: {(line.quantity * line.unitPrice).toLocaleString()}</span>
                    {canManage ? (
                      <button
                        className="text-red-600"
                        type="button"
                        onClick={() => setLinesForm((prev) => prev.filter((_, idx) => idx !== index))}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {linesForm.length === 0 ? <p className="text-sm text-slate-500">No lines.</p> : null}
          </fieldset>
          {canManage ? (
            <button
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
              type="button"
              disabled={saving}
              onClick={handleSaveLines}
            >
              {saving ? "Saving..." : "Save Lines"}
            </button>
          ) : null}
        </div>
      ) : null}

      {activeTab === "documents" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Documents</h3>
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={handleDownloadZip}
                type="button"
              >
                Download ZIP
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {documents.length === 0 ? (
                <p>No documents generated yet.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border-b py-2">
                    <div>
                      <div className="font-medium text-slate-800">{doc.fileName}</div>
                      <div className="text-xs text-slate-400">
                        {doc.manualNumber || doc.runningNumber || "-"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(doc.generatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-slate-400">{doc.templatePackId}</span>
                      {doc.fileType === "PDF" ? (
                        <button
                          className="rounded border px-2 py-1 text-xs"
                          onClick={() => handleDownload(doc.id, doc.fileName)}
                          type="button"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">ZIP bundle</span>
                      )}
                      {doc.fileType === "PDF" ? (
                        <button
                          className="rounded border px-2 py-1 text-xs"
                          onClick={() => handlePreview(doc)}
                          type="button"
                        >
                          ดูเอกสาร
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 rounded border border-dashed border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium text-slate-700">ตัวอย่างเอกสาร</div>
                {previewDoc ? (
                  <button
                    className="text-xs text-slate-500"
                    type="button"
                    onClick={() => {
                      setPreviewDoc(null);
                      setPreviewUrl((prev) => {
                        if (prev) {
                          window.URL.revokeObjectURL(prev);
                        }
                        return null;
                      });
                    }}
                  >
                    ปิดตัวอย่าง
                  </button>
                ) : null}
              </div>
              {previewLoading ? (
                <p className="mt-3 text-sm text-slate-500">กำลังโหลดเอกสาร...</p>
              ) : previewUrl ? (
                <div className="mt-3 h-[70vh] w-full rounded border bg-white">
                  <iframe className="h-full w-full" src={previewUrl} title={previewDoc?.fileName || "preview"} />
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">เลือกเอกสาร PDF เพื่อแสดงตัวอย่าง</p>
              )}
            </div>
          </div>
          {canManage ? (
            <>
              <div className="rounded-lg bg-white p-4 shadow">
                <h4 className="text-sm font-semibold text-slate-700">Generate Pack</h4>
                <div className="mt-3 grid gap-3">
                  {caseData.caseType === "LUNCH" && lunchMeta ? (
                    <button
                      className="rounded border px-3 py-2 text-sm"
                      type="button"
                      onClick={applyLunchInputs}
                    >
                      โหลดข้อมูลอาหารกลางวัน
                    </button>
                  ) : null}
                  <select
                    className="rounded border px-3 py-2"
                    value={selectedPackId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setSelectedPackId(nextId);
                      const pack = templates.find((item) => item.id === nextId);
                      if (pack) {
                        setPdfMode(pack.pdfMode);
                        setInputs(
                          pack.inputCells.reduce<Record<string, string>>((acc, cell) => {
                            acc[cell.key] = "";
                            return acc;
                          }, {})
                        );
                      }
                    }}
                  >
                    {templates.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name_th} ({pack.caseType})
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border px-3 py-2"
                    value={pdfMode}
                    onChange={(event) => setPdfMode(event.target.value as "perSheet" | "singlePdf")}
                  >
                    <option value="singlePdf">Single PDF</option>
                    <option value="perSheet">Per Sheet</option>
                  </select>
                  {selectedPack?.inputCells.map((cell) => (
                    <div key={cell.key}>
                      <label className="text-sm font-medium text-slate-600">{cell.key}</label>
                      <input
                        className="mt-1 w-full rounded border px-3 py-2"
                        value={inputs[cell.key] || ""}
                        onChange={(event) =>
                          setInputs((prev) => ({
                            ...prev,
                            [cell.key]: event.target.value
                          }))
                        }
                        placeholder={cell.key}
                      />
                    </div>
                  ))}
                  <button
                    className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                    disabled={saving || !selectedPack || selectedPack.isActive === false}
                    onClick={handleGenerate}
                    type="button"
                  >
                    {saving ? "Generating..." : "Generate Pack"}
                  </button>
                </div>
              </div>
              {caseData.isBackdated ? (
                <div className="rounded-lg bg-white p-4 shadow lg:col-span-3">
                  <h4 className="text-sm font-semibold text-slate-700">Override Document Number</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <select
                      className="rounded border px-3 py-2"
                      value={overrideForm.documentId}
                      onChange={(event) =>
                        setOverrideForm((prev) => ({ ...prev, documentId: event.target.value }))
                      }
                    >
                      <option value="">Select document</option>
                    {documents.filter((doc) => doc.fileType === "PDF").map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fileName}
                      </option>
                    ))}
                    </select>
                    <input
                      className="rounded border px-3 py-2"
                      placeholder="Manual number"
                      value={overrideForm.number}
                      onChange={(event) => setOverrideForm((prev) => ({ ...prev, number: event.target.value }))}
                    />
                    <input
                      className="rounded border px-3 py-2"
                      placeholder="Reason"
                      value={overrideForm.reason}
                      onChange={(event) => setOverrideForm((prev) => ({ ...prev, reason: event.target.value }))}
                    />
                    <input
                      className="rounded border px-3 py-2"
                      type="date"
                      value={overrideForm.documentDate}
                      onChange={(event) =>
                        setOverrideForm((prev) => ({ ...prev, documentDate: event.target.value }))
                      }
                    />
                  </div>
                  <button
                    className="mt-3 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
                    disabled={saving || !overrideForm.documentId}
                    onClick={handleOverrideNumber}
                    type="button"
                  >
                    {saving ? "Saving..." : "Override"}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {activeTab === "approvals" ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <div className="space-y-2 text-sm text-slate-600">
            {(caseData.approvals || []).length === 0 ? (
              <p>No approvals yet.</p>
            ) : (
              (caseData.approvals || []).map((approval) => (
                <div key={approval.id} className="border-b py-2">
                  <div className="font-medium text-slate-800">{approval.action}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(approval.createdAt).toLocaleString()}
                  </div>
                  {approval.comment ? <div className="text-xs">{approval.comment}</div> : null}
                </div>
              ))
            )}
          </div>
          <div className="mt-4 space-y-2">
            <textarea
              className="w-full rounded border px-3 py-2"
              placeholder="Approval comment"
              value={approvalComment}
              onChange={(event) => setApprovalComment(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {canManage && caseData.status === "DRAFT" ? (
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                  type="button"
                  disabled={saving}
                  onClick={() => handleApproval("SUBMIT")}
                >
                  Submit
                </button>
              ) : null}
              {canApprove && caseData.status === "SUBMITTED" ? (
                <>
                  <button
                    className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                    type="button"
                    disabled={saving}
                    onClick={() => handleApproval("APPROVE")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
                    type="button"
                    disabled={saving}
                    onClick={() => handleApproval("REJECT")}
                  >
                    Reject
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "audit" ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                <th className="py-2">Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Reason</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="py-2">{log.action}</td>
                  <td>{log.entity}</td>
                  <td className="text-xs text-slate-500">{log.entityId}</td>
                  <td>{log.reason || "-"}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
