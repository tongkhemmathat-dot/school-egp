"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Organization } from "../../lib/types";

export default function SchoolInfoPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    affiliation: "",
    studentCount: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Organization>("admin/organization")
      .then((data) => {
        setOrg(data);
        setForm({
          name: data.name || "",
          address: data.address || "",
          affiliation: data.affiliation || "",
          studentCount: data.studentCount?.toString() || ""
        });
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await apiFetch("admin/organization", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          address: form.address || null,
          affiliation: form.affiliation || null,
          studentCount: form.studentCount ? Number(form.studentCount) : null
        })
      });
      setMessage("บันทึกข้อมูลโรงเรียนเรียบร้อยแล้ว");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="excel-title text-2xl">รายละเอียดโรงเรียน</h2>
        <p className="excel-hint mt-1">ข้อมูลนี้จะถูกนำไปใช้ในเอกสารทางราชการ</p>
      </div>
      <div className="excel-panel p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="excel-label">ชื่อโรงเรียน</label>
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
            <label className="excel-label">สังกัด</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.affiliation}
              onChange={(event) => setForm((prev) => ({ ...prev, affiliation: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">จำนวนนักเรียน</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.studentCount}
              onChange={(event) => setForm((prev) => ({ ...prev, studentCount: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="excel-hint">
            {org ? `รหัสหน่วยงาน: ${org.id}` : "กำลังโหลดข้อมูล..."}
          </div>
          <button
            className="excel-button excel-button-primary"
            type="button"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}
