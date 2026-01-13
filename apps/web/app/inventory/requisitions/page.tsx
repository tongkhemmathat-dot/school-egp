"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import Link from "next/link";
import type { Item, MaterialRequisition, Warehouse } from "../../../lib/types";

type LineInput = { itemId: string; quantity: number };

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selected, setSelected] = useState<MaterialRequisition | null>(null);
  const [form, setForm] = useState({
    requesterName: "",
    warehouseId: "",
    lines: [{ itemId: "", quantity: 1 }] as LineInput[]
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canEditSelected = !selected || selected.status === "DRAFT";

  const loadData = useCallback(async () => {
    try {
      const [reqs, itemData, warehouseData] = await Promise.all([
        apiFetch<MaterialRequisition[]>("inventory/requisitions"),
        apiFetch<Item[]>("admin/items"),
        apiFetch<Warehouse[]>("admin/warehouses")
      ]);
      setRequisitions(reqs);
      setItems(itemData);
      setWarehouses(warehouseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requisitions");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({ requesterName: "", warehouseId: "", lines: [{ itemId: "", quantity: 1 }] });
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (form.lines.some((line) => !line.itemId)) {
        setError("Please select item for all lines");
        setLoading(false);
        return;
      }
      await apiFetch("inventory/requisitions", {
        method: "POST",
        body: JSON.stringify({
          requesterName: form.requesterName,
          warehouseId: form.warehouseId,
          lines: form.lines.map((line) => ({ itemId: line.itemId, quantity: Number(line.quantity) }))
        })
      });
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create requisition");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    if (selected.status === "ISSUED") {
      setError("Issued requisitions cannot be updated");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (form.lines.some((line) => !line.itemId)) {
        setError("Please select item for all lines");
        setLoading(false);
        return;
      }
      await apiFetch(`inventory/requisitions/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          requesterName: form.requesterName,
          warehouseId: form.warehouseId,
          lines: form.lines.map((line) => ({ itemId: line.itemId, quantity: Number(line.quantity) }))
        })
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update requisition");
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`inventory/requisitions/${id}/issue`, { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue requisition");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (selected?.status === "ISSUED") {
      setError("Issued requisitions cannot be deleted");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`inventory/requisitions/${id}`, { method: "DELETE" });
      setSelected(null);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete requisition");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (req: MaterialRequisition) => {
    setSelected(req);
    setForm({
      requesterName: req.requesterName,
      warehouseId: req.warehouseId,
      lines: (req.lines || []).map((line) => ({
        itemId: line.itemId,
        quantity: line.quantity
      }))
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Material Requisitions</h2>
        <Link className="rounded border px-3 py-2 text-sm" href="/inventory/stock-card">
          Stock Card
        </Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow lg:col-span-2">
          <h3 className="text-lg font-semibold">Requisition List</h3>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                <th className="py-2">Requester</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map((req) => (
                <tr key={req.id} className="border-b">
                  <td className="py-2">{req.requesterName}</td>
                  <td>{req.warehouse?.name || "-"}</td>
                  <td>{req.status}</td>
                  <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <button
                      className="rounded border px-2 py-1 text-xs"
                      type="button"
                      onClick={() => handleSelect(req)}
                    >
                      Edit
                    </button>
                    {req.status === "DRAFT" ? (
                      <button
                        className="ml-2 rounded bg-blue-600 px-2 py-1 text-xs text-white"
                        type="button"
                        onClick={() => handleIssue(req.id)}
                      >
                        Issue
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {requisitions.length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={5}>
                    No requisitions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-lg font-semibold">{selected ? "Edit Requisition" : "Create Requisition"}</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium">Requester Name</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.requesterName}
                onChange={(event) => setForm((prev) => ({ ...prev, requesterName: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Warehouse</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.warehouseId}
                onChange={(event) => setForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Lines</label>
              <div className="space-y-2">
                {form.lines.map((line, index) => (
                  <div key={`line-${index}`} className="rounded border p-2">
                    <select
                      className="w-full rounded border px-2 py-1 text-sm"
                      value={line.itemId}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          lines: prev.lines.map((item, idx) =>
                            idx === index ? { ...item, itemId: event.target.value } : item
                          )
                        }))
                      }
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="mt-2 w-full rounded border px-2 py-1 text-sm"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          lines: prev.lines.map((item, idx) =>
                            idx === index ? { ...item, quantity: Number(event.target.value) } : item
                          )
                        }))
                      }
                    />
                    <button
                      className="mt-2 text-xs text-red-600"
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          lines: prev.lines.filter((_, idx) => idx !== index)
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mt-2 rounded border px-2 py-1 text-xs"
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    lines: [...prev.lines, { itemId: "", quantity: 1 }]
                  }))
                }
              >
                Add Line
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
                type="button"
                disabled={loading || !canEditSelected}
                onClick={selected ? handleUpdate : handleCreate}
              >
                {loading ? "Saving..." : selected ? "Update" : "Create"}
              </button>
              {selected ? (
                <>
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
                  <button
                    className="rounded border px-3 py-2 text-sm text-red-600"
                    type="button"
                    disabled={!canEditSelected}
                    onClick={() => handleDelete(selected.id)}
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
