"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import type { ProcurementCase, Vendor } from "../../lib/types";

const statusOptions = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"];

export default function CasesPage() {
  const [cases, setCases] = useState<ProcurementCase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filters, setFilters] = useState({
    query: "",
    caseType: "",
    status: "",
    vendorId: "",
    fiscalYear: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.caseType) params.set("caseType", filters.caseType);
      if (filters.status) params.set("status", filters.status);
      if (filters.vendorId) params.set("vendorId", filters.vendorId);
      if (filters.fiscalYear) params.set("fiscalYear", filters.fiscalYear);
      const data = await apiFetch<ProcurementCase[]>(`cases?${params.toString()}`);
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let active = true;
    apiFetch<Vendor[]>("admin/vendors")
      .then((data) => {
        if (!active) return;
        setVendors(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filtered = useMemo(() => {
    if (!filters.query) return cases;
    const q = filters.query.toLowerCase();
    return cases.filter((item) => item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
  }, [cases, filters.query]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Cases</h2>
        <Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/cases/new">
          New Case
        </Link>
      </div>
      <div className="mt-6 rounded-lg bg-white p-4 shadow">
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
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Fiscal Year"
            value={filters.fiscalYear}
            onChange={(event) => setFilters((prev) => ({ ...prev, fiscalYear: event.target.value }))}
          />
          <button
            className="rounded bg-slate-900 px-4 py-2 text-white"
            type="button"
            onClick={loadCases}
          >
            Apply Filters
          </button>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading cases...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {!loading && filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No cases found.</p>
        ) : null}
        {filtered.length > 0 ? (
          <table className="mt-4 w-full text-left">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-2">Case ID</th>
                <th>Title</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">
                    <Link className="text-blue-600" href={`/cases/${item.id}`}>
                      {item.id}
                    </Link>
                  </td>
                  <td>{item.title}</td>
                  <td>{item.vendor?.name || "-"}</td>
                  <td>{item.caseType}</td>
                  <td>{item.budgetAmount.toLocaleString()}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
