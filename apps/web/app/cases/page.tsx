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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">School Procurement</p>
          <h2 className="excel-title text-2xl">แฟ้มงานจัดซื้อ/จัดจ้าง</h2>
          <p className="excel-hint mt-1">ค้นหาแฟ้มงานตามปีงบประมาณ ผู้ขาย และสถานะได้ทันที</p>
        </div>
        <Link className="excel-button excel-button-primary" href="/cases/new">
          สร้างแฟ้มงานใหม่
        </Link>
      </div>

      <div className="excel-panel p-5">
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="excel-label">ค้นหาชื่อแฟ้มงาน</label>
              <input
                className="excel-input mt-1"
                placeholder="พิมพ์ชื่อแฟ้มงาน"
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
            </div>
            <div>
              <label className="excel-label">ปีงบประมาณ</label>
              <input
                className="excel-input mt-1"
                placeholder="เช่น 2567"
                value={filters.fiscalYear}
                onChange={(event) => setFilters((prev) => ({ ...prev, fiscalYear: event.target.value }))}
              />
            </div>
            <div>
              <label className="excel-label">ประเภทงาน</label>
              <select
                className="excel-input excel-input-green mt-1"
                value={filters.caseType}
                onChange={(event) => setFilters((prev) => ({ ...prev, caseType: event.target.value }))}
              >
                <option value="">ทุกประเภท</option>
                <option value="HIRE">จัดจ้าง</option>
                <option value="PURCHASE">จัดซื้อ</option>
                <option value="LUNCH">อาหารกลางวัน</option>
                <option value="INTERNET">อินเทอร์เน็ต</option>
              </select>
            </div>
            <div>
              <label className="excel-label">สถานะ</label>
              <select
                className="excel-input excel-input-green mt-1"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="">ทุกสถานะ</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="excel-label">ผู้ขาย/ผู้รับจ้าง</label>
              <select
                className="excel-input excel-input-green mt-1"
                value={filters.vendorId}
                onChange={(event) => setFilters((prev) => ({ ...prev, vendorId: event.target.value }))}
              >
                <option value="">ทั้งหมด</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-dashed border-[var(--excel-border)] bg-slate-50/60 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">สรุปแฟ้มงาน</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="excel-chip">ทั้งหมด {filtered.length} รายการ</span>
                <span className="excel-chip">สถานะ {filters.status || "ทั้งหมด"}</span>
                <span className="excel-chip">ประเภท {filters.caseType || "ทั้งหมด"}</span>
              </div>
            </div>
            <button
              className="excel-button excel-button-primary w-full"
              type="button"
              onClick={loadCases}
            >
              ค้นหาแฟ้มงาน
            </button>
          </div>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-500">กำลังโหลดข้อมูลแฟ้มงาน...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="excel-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="excel-title text-lg">รายการแฟ้มงาน</h3>
          <span className="excel-chip">ทั้งหมด {filtered.length} รายการ</span>
        </div>
        {!loading && filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">ยังไม่มีแฟ้มงานในระบบ</p>
        ) : null}
        {filtered.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2">ชื่อแฟ้มงาน</th>
                  <th>ผู้ขาย/ผู้รับจ้าง</th>
                  <th>ประเภท</th>
                  <th>วงเงิน</th>
                  <th>สถานะ</th>
                  <th>วันที่สร้าง</th>
                  <th>แก้ไขล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 font-medium text-slate-800">
                      <Link className="text-[var(--excel-accent)] underline" href={`/cases/${item.id}`}>
                        {item.title}
                      </Link>
                    </td>
                    <td>{item.vendor?.name || "-"}</td>
                    <td>{item.caseType}</td>
                    <td>{item.budgetAmount.toLocaleString()}</td>
                    <td>
                      <span className="excel-chip">{item.status}</span>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>{new Date(item.updatedAt).toLocaleDateString("th-TH")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
