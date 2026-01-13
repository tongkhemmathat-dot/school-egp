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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="excel-title text-2xl">ทะเบียนคุมจัดซื้อ/จัดจ้าง</h2>
          <p className="excel-hint mt-1">กรอกช่องสีเหลืองเพื่อกำหนดตัวกรอง แล้วกดดาวน์โหลดรายงาน</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="excel-chip">สีเหลือง = กรอกข้อมูล</span>
          <span className="excel-chip">สีเขียว = เลือกจากรายการ</span>
          <span className="excel-chip">สีแดง = ระบบคำนวณเอง</span>
        </div>
      </div>

      <div className="excel-panel p-6">
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="excel-label">คำค้นหาเรื่อง/โครงการ</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              placeholder="พิมพ์ชื่อเรื่องหรือโครงการ"
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            />
            <p className="excel-hint mt-1">ค้นหาจากชื่อเรื่องที่บันทึกไว้</p>
          </div>
          <div className="md:col-span-3">
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
          <div className="md:col-span-4">
            <label className="excel-label">คู่ค้า/ผู้รับจ้าง</label>
            <select
              className="excel-input excel-input-green mt-1"
              value={filters.vendorId}
              onChange={(event) => setFilters((prev) => ({ ...prev, vendorId: event.target.value }))}
            >
              <option value="">ทุกผู้ขาย</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
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
          <div className="md:col-span-3">
            <label className="excel-label">วันที่เริ่มต้น</label>
            <input
              className="excel-input excel-input-green mt-1"
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            />
          </div>
          <div className="md:col-span-3">
            <label className="excel-label">วันที่สิ้นสุด</label>
            <input
              className="excel-input excel-input-green mt-1"
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            />
          </div>
          <div className="md:col-span-3">
            <label className="excel-label">ปีงบประมาณ</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              placeholder="เช่น 2567"
              value={filters.fiscalYear}
              onChange={(event) => setFilters((prev) => ({ ...prev, fiscalYear: event.target.value }))}
            />
          </div>

          <div className="md:col-span-12">
            <button
              className="excel-button excel-button-primary w-full disabled:opacity-60"
              disabled={loading}
              onClick={handleExport}
              type="button"
            >
              {loading ? "กำลังสร้างไฟล์รายงาน..." : "ดาวน์โหลดรายงานทะเบียน (Excel)"}
            </button>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <p className="excel-hint mt-2">ดาวน์โหลดรายงานทะเบียนคุมจัดซื้อ/จัดจ้างเป็นไฟล์ Excel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
