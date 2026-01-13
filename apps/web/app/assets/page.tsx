"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Asset, DepreciationPolicy } from "../../lib/types";

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [policies, setPolicies] = useState<DepreciationPolicy[]>([]);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [form, setForm] = useState({
    name: "",
    assetCode: "",
    acquisitionDate: "",
    cost: 0,
    salvageValue: 0,
    usefulLifeMonths: 12,
    policyId: ""
  });
  const [policyForm, setPolicyForm] = useState({
    name: "",
    isDefault: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [assetData, policyData] = await Promise.all([
        apiFetch<Asset[]>("assets"),
        apiFetch<DepreciationPolicy[]>("assets/policies")
      ]);
      setAssets(assetData);
      setPolicies(policyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({
      name: "",
      assetCode: "",
      acquisitionDate: "",
      cost: 0,
      salvageValue: 0,
      usefulLifeMonths: 12,
      policyId: ""
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selected) {
        await apiFetch(`assets/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            assetCode: form.assetCode,
            acquisitionDate: form.acquisitionDate,
            cost: Number(form.cost),
            salvageValue: Number(form.salvageValue),
            usefulLifeMonths: Number(form.usefulLifeMonths),
            policyId: form.policyId
          })
        });
      } else {
        await apiFetch("assets", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            assetCode: form.assetCode,
            acquisitionDate: form.acquisitionDate,
            cost: Number(form.cost),
            salvageValue: Number(form.salvageValue),
            usefulLifeMonths: Number(form.usefulLifeMonths),
            policyId: form.policyId
          })
        });
      }
      setSelected(null);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save asset");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`assets/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete asset");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (asset: Asset) => {
    setSelected(asset);
    setForm({
      name: asset.name,
      assetCode: asset.assetCode,
      acquisitionDate: asset.acquisitionDate.slice(0, 10),
      cost: asset.cost,
      salvageValue: asset.salvageValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      policyId: asset.policy?.id || ""
    });
  };

  const handlePolicyCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("assets/policies", {
        method: "POST",
        body: JSON.stringify({
          name: policyForm.name,
          method: "STRAIGHT_LINE",
          isDefault: policyForm.isDefault
        })
      });
      setPolicyForm({ name: "", isDefault: false });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Assets</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Asset Register</h3>
            <a
              className="rounded border px-3 py-2 text-sm"
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/assets/register/export`}
              target="_blank"
              rel="noreferrer"
            >
              Export XLSX
            </a>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                <th className="py-2">Asset Code</th>
                <th>Name</th>
                <th>Cost</th>
                <th>Policy</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b">
                  <td className="py-2">{asset.assetCode}</td>
                  <td>
                    <Link className="text-blue-600" href={`/assets/${asset.id}`}>
                      {asset.name}
                    </Link>
                  </td>
                  <td>{asset.cost.toLocaleString()}</td>
                  <td>{asset.policy?.name || "-"}</td>
                  <td className="text-right">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      type="button"
                      onClick={() => handleSelect(asset)}
                    >
                      Edit
                    </button>
                    {user?.role === "Admin" ? (
                      <button
                        className="ml-2 rounded border px-2 py-1 text-xs text-red-600"
                        type="button"
                        onClick={() => handleDelete(asset.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {assets.length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={5}>
                    No assets found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">{selected ? "Edit Asset" : "Create Asset"}</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Asset Code</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.assetCode}
                onChange={(event) => setForm((prev) => ({ ...prev, assetCode: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Acquisition Date</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                type="date"
                value={form.acquisitionDate}
                onChange={(event) => setForm((prev) => ({ ...prev, acquisitionDate: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cost</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                type="number"
                min={0}
                value={form.cost}
                onChange={(event) => setForm((prev) => ({ ...prev, cost: Number(event.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Salvage Value</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                type="number"
                min={0}
                value={form.salvageValue}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, salvageValue: Number(event.target.value) }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Useful Life (months)</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                type="number"
                min={1}
                value={form.usefulLifeMonths}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, usefulLifeMonths: Number(event.target.value) }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Policy</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.policyId}
                onChange={(event) => setForm((prev) => ({ ...prev, policyId: event.target.value }))}
              >
                <option value="">Select policy</option>
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
                type="button"
                disabled={loading}
                onClick={handleSave}
              >
                {loading ? "Saving..." : selected ? "Update" : "Create"}
              </button>
              {selected ? (
                <button
                  className="rounded border px-3 py-2 text-sm"
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
          {user?.role === "Admin" ? (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold">Create Policy</h4>
              <div className="mt-2 space-y-2">
                <input
                  className="w-full rounded border px-3 py-2"
                  placeholder="Policy name"
                  value={policyForm.name}
                  onChange={(event) => setPolicyForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={policyForm.isDefault}
                    onChange={(event) =>
                      setPolicyForm((prev) => ({ ...prev, isDefault: event.target.checked }))
                    }
                  />
                  Set as default
                </label>
                <button
                  className="rounded border px-3 py-2 text-sm"
                  type="button"
                  onClick={handlePolicyCreate}
                >
                  Add Policy
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
