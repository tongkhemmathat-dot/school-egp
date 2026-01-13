"use client";

import { useEffect, useState } from "react";
import type { Vendor } from "../../../lib/types";
import { apiFetch } from "../../../lib/api";

const statusOptions = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"];

export default function ProcurementRegisterReport() {
  const [filters, setFilters] = useState({
    query: "",
    caseType: "",
    vendorId: "",
    status: "",
    from: "",
    to: "",
    fiscalYear: ""
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Vendor[]>("admin/vendors")
      .then((data) => setVendors(data))
      .catch(() => undefined);
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (filters.caseType) params.set("caseType", filters.caseType);
      if (filters.vendorId) params.set("vendorId", filters.vendorId);
      if (filters.status) params.set("status", filters.status);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.fiscalYear) params.set("fiscalYear", filters.fiscalYear);
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/reports/procurement-register?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });
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
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Search by title"
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
          />
          <select
            className="rounded border px-3 py-2"
            value={filters.caseType}
            onChange={(event) => setFilters((prev) => ({ ...prev, caseType: event.target.value }))}
          >
            <option value="">All Types</option>
            <option value="HIRE">HIRE</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="LUNCH">LUNCH</option>
            <option value="INTERNET">INTERNET</option>
          </select>
          <select
            className="rounded border px-3 py-2"
            value={filters.vendorId}
            onChange={(event) => setFilters((prev) => ({ ...prev, vendorId: event.target.value }))}
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border px-3 py-2"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            className="rounded border px-3 py-2"
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Fiscal Year"
            value={filters.fiscalYear}
            onChange={(event) => setFilters((prev) => ({ ...prev, fiscalYear: event.target.value }))}
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
