"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import type { Item, StockCardRow, Warehouse } from "../../../lib/types";

export default function StockCardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [rows, setRows] = useState<StockCardRow[]>([]);
  const [filters, setFilters] = useState({
    itemId: "",
    warehouseId: "",
    from: "",
    to: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const [itemData, warehouseData] = await Promise.all([
        apiFetch<Item[]>("admin/items"),
        apiFetch<Warehouse[]>("admin/warehouses")
      ]);
      setItems(itemData);
      setWarehouses(warehouseData);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const loadStockCard = async () => {
    if (!filters.itemId || !filters.warehouseId) {
      setError("Please select item and warehouse");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        itemId: filters.itemId,
        warehouseId: filters.warehouseId
      });
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const data = await apiFetch<StockCardRow[]>(`inventory/stock-card?${params.toString()}`);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock card");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!filters.itemId || !filters.warehouseId) {
      setError("Please select item and warehouse");
      return;
    }
    const params = new URLSearchParams({
      itemId: filters.itemId,
      warehouseId: filters.warehouseId
    });
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/inventory/stock-card/export?${params.toString()}`,
      { credentials: "include" }
    );
    if (!response.ok) {
      setError("Failed to export stock card");
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stock-card.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Stock Card</h2>
      <div className="mt-4 rounded-lg bg-white p-4 shadow">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="rounded border px-3 py-2"
            value={filters.itemId}
            onChange={(event) => setFilters((prev) => ({ ...prev, itemId: event.target.value }))}
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border px-3 py-2"
            value={filters.warehouseId}
            onChange={(event) => setFilters((prev) => ({ ...prev, warehouseId: event.target.value }))}
          >
            <option value="">Select warehouse</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
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
        </div>
        <div className="mt-3 flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 text-white" type="button" onClick={loadStockCard}>
            {loading ? "Loading..." : "Load"}
          </button>
          <button className="rounded border px-4 py-2" type="button" onClick={handleExport}>
            Export XLSX
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              <th className="py-2">Date</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Balance</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td>{row.transactionType}</td>
                <td>{row.quantity}</td>
                <td>{row.balance}</td>
                <td>{row.referenceId || "-"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-500" colSpan={5}>
                  No transactions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
