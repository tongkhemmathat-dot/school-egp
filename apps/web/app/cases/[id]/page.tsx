"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, getApiBase, getToken } from "../../../lib/api";
import type { DocumentRecord, ProcurementCase, TemplatePack } from "../../../lib/types";

const statusOptions = ["DRAFT", "IN_PROGRESS", "COMPLETED"];

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = typeof params?.id === "string" ? params.id : params?.id?.[0] || "";
  const [caseData, setCaseData] = useState<ProcurementCase | null>(null);
  const [templates, setTemplates] = useState<TemplatePack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCase = async () => {
    if (!caseId) return;
    const data = await apiFetch<ProcurementCase>(`cases/${caseId}`);
    setCaseData(data);
    setStatus(data.status);
  };

  useEffect(() => {
    let active = true;
    if (!caseId) return;
    Promise.all([apiFetch<ProcurementCase>(`cases/${caseId}`), apiFetch<TemplatePack[]>("templates")])
      .then(([caseResponse, templateResponse]) => {
        if (!active) return;
        setCaseData(caseResponse);
        setStatus(caseResponse.status);
        setTemplates(templateResponse);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setActionError(err instanceof Error ? err.message : "Failed to load case");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  useEffect(() => {
    if (!caseData || templates.length === 0) return;
    const match = templates.find((pack) => pack.caseType === caseData.caseType) || templates[0];
    if (match && !selectedPackId) {
      setSelectedPackId(match.id);
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

  const handleGenerate = async () => {
    if (!selectedPack || !caseId) return;
    setGenerating(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}/documents/generate`, {
        method: "POST",
        body: JSON.stringify({ packId: selectedPack.id, inputs })
      });
      await loadCase();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate documents");
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusSave = async () => {
    if (!caseId || !caseData) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetch(`cases/${caseId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadCase();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!caseId) return;
    const token = getToken();
    if (!token) return;
    const response = await fetch(`${getApiBase()}/cases/${caseId}/documents/download-zip`, {
      headers: { Authorization: `Bearer ${token}` }
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
      {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow lg:col-span-1">
          <h3 className="text-lg font-semibold">Summary</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-800">Type:</span> {caseData.caseType}
            </div>
            <div>
              <span className="font-medium text-slate-800">Status:</span> {caseData.status}
            </div>
            <div>
              <span className="font-medium text-slate-800">Created:</span>{" "}
              {new Date(caseData.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-slate-800">Backdated:</span>{" "}
              {caseData.isBackdated ? "Yes" : "No"}
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium">Update Status</label>
            <div className="mt-2 flex gap-2">
              <select
                className="w-full rounded border px-3 py-2"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
                disabled={saving || status === caseData.status}
                onClick={handleStatusSave}
                type="button"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Documents</h3>
            <button
              className="rounded border px-3 py-2 text-sm hover:bg-slate-50"
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
                      {new Date(doc.generatedAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs uppercase text-slate-400">{doc.templatePackId}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-700">Generate Document Pack</h4>
            <div className="mt-3 grid gap-3">
              <select
                className="rounded border px-3 py-2"
                value={selectedPackId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedPackId(nextId);
                  const pack = templates.find((item) => item.id === nextId);
                  if (pack) {
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
                disabled={generating || !selectedPack}
                onClick={handleGenerate}
                type="button"
              >
                {generating ? "Generating..." : "Generate Pack"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
