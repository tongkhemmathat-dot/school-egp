"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Organization, StaffMember } from "../../lib/types";

export default function StaffPage() {
  const [form, setForm] = useState({
    officerName: "",
    headOfficerName: "",
    financeOfficerName: "",
    directorName: ""
  });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [newMember, setNewMember] = useState({ name: "", position: "" });
  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [memberMessage, setMemberMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([apiFetch<Organization>("admin/organization"), apiFetch<StaffMember[]>("admin/staff")]).then(
      ([orgResult, staffResult]) => {
        if (orgResult.status === "fulfilled") {
          const data = orgResult.value;
          setForm({
            officerName: data.officerName || "",
            headOfficerName: data.headOfficerName || "",
            financeOfficerName: data.financeOfficerName || "",
            directorName: data.directorName || ""
          });
        }
        if (staffResult.status === "fulfilled") {
          setStaffMembers(staffResult.value);
        }
      }
    );
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

  const handleMemberChange = (id: string, field: "name" | "position", value: string) => {
    setStaffMembers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddMember = async () => {
    setMemberMessage(null);
    if (!newMember.name.trim() || !newMember.position.trim()) {
      setMemberMessage("กรุณากรอกชื่อและตำแหน่งให้ครบถ้วน");
      return;
    }
    setMemberLoading("new");
    try {
      const created = await apiFetch<StaffMember>("admin/staff", {
        method: "POST",
        body: JSON.stringify({
          name: newMember.name.trim(),
          position: newMember.position.trim()
        })
      });
      setStaffMembers((prev) => [created, ...prev]);
      setNewMember({ name: "", position: "" });
      setMemberMessage("เพิ่มบุคลากรเรียบร้อยแล้ว");
    } catch (err) {
      setMemberMessage(err instanceof Error ? err.message : "ไม่สามารถเพิ่มบุคลากรได้");
    } finally {
      setMemberLoading(null);
    }
  };

  const handleUpdateMember = async (member: StaffMember) => {
    setMemberMessage(null);
    if (!member.name.trim() || !member.position.trim()) {
      setMemberMessage("กรุณากรอกชื่อและตำแหน่งให้ครบถ้วน");
      return;
    }
    setMemberLoading(member.id);
    try {
      const updated = await apiFetch<StaffMember>(`admin/staff/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: member.name.trim(),
          position: member.position.trim()
        })
      });
      setStaffMembers((prev) => prev.map((item) => (item.id === member.id ? updated : item)));
      setMemberMessage("บันทึกการแก้ไขเรียบร้อยแล้ว");
    } catch (err) {
      setMemberMessage(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setMemberLoading(null);
    }
  };

  const handleDeleteMember = async (member: StaffMember) => {
    setMemberMessage(null);
    setMemberLoading(member.id);
    try {
      await apiFetch(`admin/staff/${member.id}`, { method: "DELETE" });
      setStaffMembers((prev) => prev.filter((item) => item.id !== member.id));
      setMemberMessage("ลบรายการบุคลากรเรียบร้อยแล้ว");
    } catch (err) {
      setMemberMessage(err instanceof Error ? err.message : "ไม่สามารถลบรายการได้");
    } finally {
      setMemberLoading(null);
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
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูลหลัก"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </div>

      <div className="excel-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="excel-title text-lg">รายชื่อบุคลากร (หลายคนหลายตำแหน่ง)</h3>
            <p className="excel-hint mt-1">ใช้สำหรับดึงรายชื่อไปแสดงในคณะกรรมการและเอกสาร</p>
          </div>
          <button
            className="excel-button excel-button-primary"
            type="button"
            onClick={handleAddMember}
            disabled={memberLoading === "new"}
          >
            {memberLoading === "new" ? "กำลังเพิ่ม..." : "เพิ่มบุคลากร"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[2fr,2fr,auto]">
          <div>
            <label className="excel-label">ตำแหน่ง</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={newMember.position}
              onChange={(event) => setNewMember((prev) => ({ ...prev, position: event.target.value }))}
              placeholder="เช่น ครู, เจ้าหน้าที่, ผู้ช่วยฯ"
            />
          </div>
          <div>
            <label className="excel-label">ชื่อ-สกุล</label>
            <input
              className="excel-input excel-input-yellow mt-1"
              value={newMember.name}
              onChange={(event) => setNewMember((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="ชื่อบุคลากร"
            />
          </div>
          <div className="flex items-end">
            <button
              className="excel-button excel-button-primary w-full"
              type="button"
              onClick={handleAddMember}
              disabled={memberLoading === "new"}
            >
              เพิ่มรายการ
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2">ตำแหน่ง</th>
                <th>ชื่อ-สกุล</th>
                <th className="text-right">การทำรายการ</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={3}>
                    ยังไม่มีรายชื่อบุคลากร
                  </td>
                </tr>
              ) : (
                staffMembers.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="py-2 pr-3">
                      <input
                        className="excel-input excel-input-yellow"
                        value={member.position}
                        onChange={(event) => handleMemberChange(member.id, "position", event.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="excel-input excel-input-yellow"
                        value={member.name}
                        onChange={(event) => handleMemberChange(member.id, "name", event.target.value)}
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          className="excel-button border border-[var(--excel-border)] px-3 py-2"
                          type="button"
                          onClick={() => handleUpdateMember(member)}
                          disabled={memberLoading === member.id}
                        >
                          บันทึก
                        </button>
                        <button
                          className="excel-button border border-red-200 px-3 py-2 text-red-600"
                          type="button"
                          onClick={() => handleDeleteMember(member)}
                          disabled={memberLoading === member.id}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {memberMessage ? <p className="mt-3 text-sm text-slate-600">{memberMessage}</p> : null}
      </div>
    </div>
  );
}
