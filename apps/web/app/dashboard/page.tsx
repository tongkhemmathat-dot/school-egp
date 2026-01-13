"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { ProcurementCase } from "../../lib/types";

export default function DashboardPage() {
  const [cases, setCases] = useState<ProcurementCase[]>([]);
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
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = cases.length;
    const drafts = cases.filter((item) => item.status === "DRAFT").length;
    const submitted = cases.filter((item) => item.status === "SUBMITTED").length;
    const approved = cases.filter((item) => item.status === "APPROVED").length;
    const rejected = cases.filter((item) => item.status === "REJECTED").length;
    const completed = cases.filter((item) => item.status === "COMPLETED").length;
    return [
      { label: "Total Cases", value: total },
      { label: "Drafts", value: drafts },
      { label: "Submitted", value: submitted },
      { label: "Approved", value: approved },
      { label: "Rejected", value: rejected },
      { label: "Completed", value: completed }
    ];
  }, [cases]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        {loading ? <span className="text-sm text-slate-400">Loading...</span> : null}
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-6">
        {stats.map((card) => (
          <div key={card.label} className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
