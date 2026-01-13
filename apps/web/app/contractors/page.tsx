"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Vendor } from "../../lib/types";

const emptyForm = {
  code: "",
  name: "",
  address: "",
  phone: "",
  taxId: "",
  citizenId: "",
  bankAccount: "",
  bankAccountName: "",
  bankName: "",
  bankBranch: ""
};

export default function ContractorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadVendors = async () => {
    const data = await apiFetch<Vendor[]>("admin/vendors");
    setVendors(data);
  };

  useEffect(() => {
    loadVendors().catch(() => undefined);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        code: form.code || null,
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        taxId: form.taxId || null,
        citizenId: form.citizenId || null,
        bankAccount: form.bankAccount || null,
        bankAccountName: form.bankAccountName || null,
        bankName: form.bankName || null,
        bankBranch: form.bankBranch || null
      };
      if (editingId) {
        await apiFetch(`admin/vendors/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("admin/vendors", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadVendors();
      setMessage("บันทึกข้อมูลผู้รับจ้างเรียบร้อยแล้ว");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setForm({
      code: vendor.code || "",
      name: vendor.name || "",
      address: vendor.address || "",
      phone: vendor.phone || "",
      taxId: vendor.taxId || "",
      citizenId: vendor.citizenId || "",
      bankAccount: vendor.bankAccount || "",
      bankAccountName: vendor.bankAccountName || "",
      bankName: vendor.bankName || "",
      bankBranch: vendor.bankBranch || ""
    });
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      await apiFetch(`admin/vendors/${id}`, { method: "DELETE" });
      await loadVendors();
      setMessage("ลบข้อมูลผู้รับจ้างเรียบร้อยแล้ว");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถลบข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="excel-title text-2xl">ข้อมูลผู้รับจ้าง</h2>
        <p className="excel-hint mt-1">จัดการข้อมูลผู้รับจ้างตามแบบฟอร์ม Excel</p>
      </div>
      <div className="excel-panel p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#74a943] text-white">
              <tr>
                <th className="border px-3 py-2">ที่</th>
                <th className="border px-3 py-2">รหัสผู้รับเหมา</th>
                <th className="border px-3 py-2">ชื่อ - นามสกุล</th>
                <th className="border px-3 py-2">ที่อยู่</th>
                <th className="border px-3 py-2">หมายเลขโทรศัพท์</th>
                <th className="border px-3 py-2">เลขประจำตัวผู้เสียภาษี</th>
                <th className="border px-3 py-2">เลขประจำตัวประชาชน</th>
                <th className="border px-3 py-2">เลขที่บัญชีธนาคาร</th>
                <th className="border px-3 py-2">ชื่อบัญชี</th>
                <th className="border px-3 py-2">ธนาคาร</th>
                <th className="border px-3 py-2">สาขา</th>
                <th className="border px-3 py-2">การทำรายการ</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, index) => (
                <tr key={vendor.id} className="border-b">
                  <td className="border px-3 py-2 text-center">{index + 1}</td>
                  <td className="border px-3 py-2">{vendor.code || "-"}</td>
                  <td className="border px-3 py-2">{vendor.name}</td>
                  <td className="border px-3 py-2">{vendor.address || "-"}</td>
                  <td className="border px-3 py-2">{vendor.phone || "-"}</td>
                  <td className="border px-3 py-2">{vendor.taxId || "-"}</td>
                  <td className="border px-3 py-2">{vendor.citizenId || "-"}</td>
                  <td className="border px-3 py-2">{vendor.bankAccount || "-"}</td>
                  <td className="border px-3 py-2">{vendor.bankAccountName || "-"}</td>
                  <td className="border px-3 py-2">{vendor.bankName || "-"}</td>
                  <td className="border px-3 py-2">{vendor.bankBranch || "-"}</td>
                  <td className="border px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        type="button"
                        onClick={() => handleEdit(vendor)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-xs text-red-600"
                        type="button"
                        onClick={() => handleDelete(vendor.id)}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 ? (
                <tr>
                  <td className="border px-3 py-4 text-center text-slate-500" colSpan={12}>
                    ยังไม่มีข้อมูลผู้รับจ้าง
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div>
            <label className="excel-label">รหัสผู้รับเหมา</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">ชื่อ - นามสกุล</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="excel-label">ที่อยู่</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">หมายเลขโทรศัพท์</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">เลขประจำตัวผู้เสียภาษี</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.taxId}
              onChange={(event) => setForm((prev) => ({ ...prev, taxId: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">เลขประจำตัวประชาชน</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.citizenId}
              onChange={(event) => setForm((prev) => ({ ...prev, citizenId: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">เลขที่บัญชีธนาคาร</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.bankAccount}
              onChange={(event) => setForm((prev) => ({ ...prev, bankAccount: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">ชื่อบัญชี</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.bankAccountName}
              onChange={(event) => setForm((prev) => ({ ...prev, bankAccountName: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">ธนาคาร</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.bankName}
              onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">สาขา</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.bankBranch}
              onChange={(event) => setForm((prev) => ({ ...prev, bankBranch: event.target.value }))}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="excel-hint">
            กรอกข้อมูลให้ครบถ้วนก่อนบันทึก เพื่อใช้ในเอกสารคำสั่งและใบสั่งจ้าง
          </p>
          <button
            className="excel-button excel-button-primary"
            type="button"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}
