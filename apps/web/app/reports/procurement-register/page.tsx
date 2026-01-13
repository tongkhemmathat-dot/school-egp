"use client";

import { useState } from "react";
import { getApiBase, getToken } from "../../../lib/api";

export default function ProcurementRegisterReport() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError("Unauthorized");
        return;
      }
      const url = new URL(`${getApiBase()}/reports/procurement-register`);
      if (query) {
        url.searchParams.set("q", query);
      }
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to export report");
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "procurement-register.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Procurement Register</h2>
      <div className="mt-4 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-full max-w-xs rounded border px-3 py-2"
            placeholder="Search by title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
            onClick={handleExport}
            type="button"
          >
            {loading ? "Exporting..." : "Export XLSX"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <p className="mt-4 text-sm text-slate-500">ดาวน์โหลดรายงานทะเบียนพัสดุเป็นไฟล์ Excel</p>
      </div>
    </div>
  );
}
