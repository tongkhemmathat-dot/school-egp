"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import type { ProcurementCase } from "../../lib/types";

export default function CasesPage() {
  const [cases, setCases] = useState<ProcurementCase[]>([]);
  const [query, setQuery] = useState("");
  const [caseType, setCaseType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<ProcurementCase[]>("cases")
      .then((data) => {
        if (!active) return;
        setCases(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load cases");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return cases.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.id.toLowerCase().includes(query.toLowerCase());
      const matchesType = caseType === "ALL" || item.caseType === caseType;
      return matchesQuery && matchesType;
    });
  }, [cases, query, caseType]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Cases</h2>
        <Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/cases/new">
          New Case
        </Link>
      </div>
      <div className="mt-6 rounded-lg bg-white p-4 shadow">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="w-full max-w-xs rounded border px-3 py-2"
            placeholder="Search cases"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="rounded border px-3 py-2"
            value={caseType}
            onChange={(event) => setCaseType(event.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="HIRE">HIRE</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="LUNCH">LUNCH</option>
            <option value="INTERNET">INTERNET</option>
          </select>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading cases...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No cases found.</p>
        ) : null}
        {filtered.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="py-2">Case ID</th>
                <th>Title</th>
                <th>Type</th>
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
                  <td>{item.caseType}</td>
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
