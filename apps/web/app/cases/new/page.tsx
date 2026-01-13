"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import type { ProcurementCase } from "../../../lib/types";

type CreateCasePayload = {
  title: string;
  caseType: string;
  isBackdated?: boolean;
};

export default function NewCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [caseType, setCaseType] = useState("HIRE");
  const [isBackdated, setIsBackdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: CreateCasePayload = { title, caseType, isBackdated };
      const created = await apiFetch<ProcurementCase>("cases", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      router.push(`/cases/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold">Create Procurement Case</h2>
      <form className="mt-6 rounded-lg bg-white p-6 shadow" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Case Title</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="จัดจ้างทั่วไป"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Case Type</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={caseType}
              onChange={(event) => setCaseType(event.target.value)}
            >
              <option value="HIRE">HIRE</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="LUNCH">LUNCH</option>
              <option value="INTERNET">INTERNET</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Backdated Case</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={isBackdated ? "true" : "false"}
              onChange={(event) => setIsBackdated(event.target.value === "true")}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <button
          className="mt-6 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating..." : "Create Case"}
        </button>
      </form>
    </div>
  );
}
