"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import type { Asset } from "../../../lib/types";

const tabs = ["summary", "depreciation"] as const;

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const assetId = typeof params?.id === "string" ? params.id : params?.id?.[0] || "";
  const [asset, setAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("summary");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;
    apiFetch<Asset>(`assets/${assetId}`)
      .then((data) => setAsset(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load asset"));
  }, [assetId]);

  const handleExport = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/assets/${assetId}/depreciation/export`,
      { credentials: "include" }
    );
    if (!response.ok) {
      setError("Failed to export depreciation schedule");
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asset-${assetId}-depreciation.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!asset) {
    return <p className="text-sm text-slate-500">{error || "Loading asset..."}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Asset {asset.assetCode}</h2>
      <p className="mt-1 text-sm text-slate-500">{asset.name}</p>
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
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {activeTab === "summary" ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-800">Cost:</span> {asset.cost.toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-slate-800">Salvage:</span>{" "}
              {asset.salvageValue.toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-slate-800">Useful Life:</span> {asset.usefulLifeMonths} months
            </div>
            <div>
              <span className="font-medium text-slate-800">Policy:</span> {asset.policy?.name || "-"}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "depreciation" ? (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Depreciation Schedule</h3>
            <button className="rounded border px-3 py-2 text-sm" type="button" onClick={handleExport}>
              Export XLSX
            </button>
          </div>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                <th className="py-2">Period</th>
                <th>Amount</th>
                <th>Accumulated</th>
                <th>Book Value</th>
              </tr>
            </thead>
            <tbody>
              {(asset.depreciationLines || []).map((line) => (
                <tr key={line.id} className="border-b">
                  <td className="py-2">{new Date(line.periodDate).toLocaleDateString()}</td>
                  <td>{line.amount.toLocaleString()}</td>
                  <td>{line.accumulated.toLocaleString()}</td>
                  <td>{line.bookValue.toLocaleString()}</td>
                </tr>
              ))}
              {(asset.depreciationLines || []).length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={4}>
                    No depreciation lines found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
