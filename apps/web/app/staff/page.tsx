"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Organization } from "../../lib/types";

export default function StaffPage() {
  const [form, setForm] = useState({
    officerName: "",
    headOfficerName: "",
    financeOfficerName: "",
    directorName: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Organization>("admin/organization")
      .then((data) => {
        setForm({
          officerName: data.officerName || "",
          headOfficerName: data.headOfficerName || "",
          financeOfficerName: data.financeOfficerName || "",
          directorName: data.directorName || ""
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
          officerName: form.officerName || null,
          headOfficerName: form.headOfficerName || null,
          financeOfficerName: form.financeOfficerName || null,
          directorName: form.directorName || null
        })
      });
      setMessage("บันทึกข้อมูลบุคลากรเรียบร้อยแล้ว");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="excel-title text-2xl">บุคลากรโรงเรียน</h2>
        <p className="excel-hint mt-1">ใช้สำหรับแสดงชื่อบุคลากรในเอกสารทางราชการ</p>
      </div>
      <div className="excel-panel p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="excel-label">เจ้าหน้าที่</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.officerName}
              onChange={(event) => setForm((prev) => ({ ...prev, officerName: event.target.value }))}
            />
          </div>
          <div>
            <label className="excel-label">หัวหน้าเจ้าหน้าที่</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.headOfficerName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, headOfficerName: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="excel-label">เจ้าหน้าที่การเงิน</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.financeOfficerName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, financeOfficerName: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="excel-label">ผู้อำนวยการโรงเรียน</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={form.directorName}
              onChange={(event) => setForm((prev) => ({ ...prev, directorName: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end">
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
