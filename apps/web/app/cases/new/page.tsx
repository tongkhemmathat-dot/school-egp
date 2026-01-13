
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import type { ProcurementCase, Vendor } from "../../../lib/types";

type DateParts = { day: string; month: string; year: string };
type CommitteeRow = { position: string; name: string; role: string };

const stepLabels = [
  "เลือกปีงบประมาณ",
  "ข้อมูลโรงเรียน",
  "ข้อมูลคำขอจัดซื้อ/จ้าง",
  "คณะกรรมการตรวจรับ",
  "ข้อมูลผู้รับจ้าง",
  "กำหนดวันเอกสาร",
  "สั่งพิมพ์เอกสาร"
];

const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม"
];

const departmentOptions = ["กลุ่มงานบริหารทั่วไป", "กลุ่มงานบริหารงานบุคคล", "กลุ่มงานบริหารงานวิชาการ"];

const committeePositions = ["ครูผู้ช่วย", "ครู", "ครูชำนาญการ", "ครูชำนาญการพิเศษ", "รองผู้อำนวยการ", "ผู้อำนวยการ"];

const committeeRoles = ["ประธาน", "กรรมการ"];

const projectOptions = [
  {
    code: "10001",
    name: "วัสดุสำนักงานจำนวน 18 รายการ",
    reason: "เพื่อใช้ในการจัดการเรียนการสอน",
    plan: "งานบริหารทั่วไป",
    budget: 9153
  },
  {
    code: "10002",
    name: "วัสดุสิ้นเปลือง (คอมพิวเตอร์) จำนวน 6 รายการ",
    reason: "เพื่อใช้ในการบริหารจัดการ",
    plan: "กลุ่มงานบริหารทั่วไป",
    budget: 3350
  }
];

const docChecklist = [
  "บันทึกข้อความ",
  "รายละเอียดแนบท้าย",
  "รายงานผล",
  "คำสั่งแต่งตั้ง",
  "ใบเสนอราคา",
  "ใบสั่งจ้าง",
  "ใบส่งมอบ",
  "ใบเบิกเงิน"
];

const buildThaiYears = (count = 6) => {
  const current = new Date().getFullYear() + 543;
  return Array.from({ length: count }, (_, idx) => (current - 2 + idx).toString());
};

const emptyDate = (): DateParts => ({ day: "", month: "", year: "" });

const toIsoDate = (parts: DateParts) => {
  if (!parts.day || !parts.month || !parts.year) return null;
  const monthIndex = months.indexOf(parts.month);
  if (monthIndex < 0) return null;
  const year = Number(parts.year) - 543;
  const month = (monthIndex + 1).toString().padStart(2, "0");
  const day = parts.day.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const [schoolInfo] = useState({
    name: "รอการตั้งค่าระบบ",
    address: "รอการตั้งค่าระบบ",
    affiliation: "รอการตั้งค่าระบบ",
    studentCount: "รอการตั้งค่าระบบ",
    officer: "รอการตั้งค่าระบบ",
    headOfficer: "รอการตั้งค่าระบบ",
    financeOfficer: "รอการตั้งค่าระบบ",
    director: "รอการตั้งค่าระบบ"
  });

  const [form, setForm] = useState({
    fiscalYear: "",
    caseType: "PURCHASE",
    recordNumber: "",
    recordDate: emptyDate(),
    department: "",
    projectCode: "",
    projectName: "",
    reason: "",
    plan: "",
    budget: "",
    deliveryDays: "",
    deliveryDate: emptyDate()
  });

  const [committee, setCommittee] = useState<CommitteeRow[]>([
    { position: "", name: "", role: "ประธาน" },
    { position: "", name: "", role: "กรรมการ" },
    { position: "", name: "", role: "กรรมการ" }
  ]);

  const [contractor, setContractor] = useState({
    vendorId: "",
    name: "",
    address: "",
    phone: "",
    citizenId: "",
    taxId: "",
    bank: "",
    bankAccount: ""
  });

  const [documentDates, setDocumentDates] = useState({
    quote: emptyDate(),
    order: emptyDate(),
    delivery: emptyDate(),
    inspection: emptyDate(),
    payment: emptyDate()
  });

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
    if (!form.projectCode) {
      setForm((prev) => ({ ...prev, projectName: "", reason: "", plan: "", budget: "" }));
      return;
    }
    const match = projectOptions.find((item) => item.code === form.projectCode);
    if (!match) return;
    setForm((prev) => ({
      ...prev,
      projectName: match.name,
      reason: match.reason,
      plan: match.plan,
      budget: match.budget.toString()
    }));
  }, [form.projectCode]);

  useEffect(() => {
    const match = vendors.find((vendor) => vendor.id === contractor.vendorId);
    if (!match) {
      setContractor((prev) => ({
        ...prev,
        name: "",
        address: "",
        phone: "",
        taxId: "",
        citizenId: "",
        bank: "",
        bankAccount: ""
      }));
      return;
    }
    setContractor((prev) => ({
      ...prev,
      name: match.name || "",
      address: match.address || "",
      phone: match.phone || "",
      taxId: match.taxId || "",
      citizenId: "",
      bank: "",
      bankAccount: ""
    }));
  }, [contractor.vendorId, vendors]);

  const yearOptions = useMemo(() => buildThaiYears(), []);
  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, idx) => `${idx + 1}`), []);

  const fiscalYearSelected = Boolean(form.fiscalYear);

  const stepCompleted = (index: number) => step > index;

  const setDateParts = (key: keyof typeof documentDates, value: DateParts) => {
    setDocumentDates((prev) => ({ ...prev, [key]: value }));
  };

  const isDateComplete = (date: DateParts) => Boolean(date.day && date.month && date.year);

  const validateStep = (current: number) => {
    if (current === 1) {
      return form.fiscalYear ? null : "กรุณาเลือกปีงบประมาณ";
    }
    if (current === 3) {
      if (
        !form.recordNumber ||
        !isDateComplete(form.recordDate) ||
        !form.department ||
        !form.projectCode ||
        !form.deliveryDays ||
        !isDateComplete(form.deliveryDate)
      ) {
        return "กรุณากรอกข้อมูลให้ครบถ้วน";
      }
    }
    if (current === 4) {
      const valid = committee.every((row) => row.position && row.name);
      if (!valid) return "กรุณากรอกข้อมูลให้ครบถ้วน";
    }
    if (current === 5) {
      if (!contractor.vendorId) return "กรุณากรอกข้อมูลให้ครบถ้วน";
    }
    if (current === 6) {
      const valid = Object.values(documentDates).every((date) => isDateComplete(date));
      if (!valid) return "กรุณากรอกข้อมูลให้ครบถ้วน";
    }
    return null;
  };

  const handleNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, stepLabels.length));
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerate = async () => {
    const message = validateStep(6);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setGenerating(true);
    setSuccessMessage("");
    setProgressIndex(0);
    setLoading(true);
    try {
      const payload = {
        title: form.projectName || "งานจัดซื้อ/จัดจ้าง",
        reason: form.reason || null,
        caseType: form.caseType,
        subtype: null,
        budgetAmount: Number(form.budget) || 0,
        fiscalYear: Number(form.fiscalYear),
        desiredDate: toIsoDate(form.deliveryDate),
        vendorId: contractor.vendorId || null,
        isBackdated: false,
        backdateReason: null,
        lines: []
      };
      const created = await apiFetch<ProcurementCase>("cases", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      docChecklist.forEach((_, index) => {
        setTimeout(() => {
          setProgressIndex(index + 1);
          if (index === docChecklist.length - 1) {
            setGenerating(false);
            setLoading(false);
            setSuccessMessage("ระบบได้จัดทำเอกสารครบถ้วนแล้ว");
            setTimeout(() => {
              router.push(`/cases/${created.id}`);
            }, 1200);
          }
        }, 600 * (index + 1));
      });
    } catch {
      setGenerating(false);
      setLoading(false);
      setError("ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="excel-title text-2xl">ระบบงานจัดซื้อ/จัดจ้าง</h2>
          <p className="excel-hint mt-1">ทำตามขั้นตอนทีละขั้น เหมือนกรอกแบบฟอร์ม Excel</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="excel-chip">สีเหลือง = กรอกข้อมูล</span>
          <span className="excel-chip">สีเขียว = เลือกจากรายการ</span>
          <span className="excel-chip">สีแดง = ระบบคำนวณเอง</span>
          <span className="excel-chip">สีเทา = ขั้นตอนไม่พร้อมใช้งาน</span>
        </div>
      </div>

      <div className="excel-panel p-4">
        <div className="grid gap-2 md:grid-cols-7">
          {stepLabels.map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const done = stepCompleted(number);
            return (
              <div
                key={label}
                className={`rounded border px-3 py-2 text-center text-xs ${
                  active
                    ? "border-[var(--excel-accent)] bg-[var(--excel-green)] font-semibold"
                    : done
                      ? "border-[var(--excel-border)] bg-white"
                      : "border-[var(--excel-border)] bg-slate-100 text-slate-400"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">STEP {number}</div>
                <div className="mt-1">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden">
        <div className="excel-panel p-4 text-sm text-slate-700">
          โหมดมือถือแสดงแบบอ่านอย่างเดียว กรุณาใช้งานผ่านแท็บเล็ตหรือคอมพิวเตอร์สำหรับการกรอกข้อมูล
        </div>
      </div>

      <div className="excel-panel p-6 md:pointer-events-auto md:opacity-100 pointer-events-none opacity-70">
        {step === 1 ? (
          <div className="space-y-4">
            <h3 className="excel-title text-lg">STEP 1: เลือกปีงบประมาณ</h3>
            <div className="max-w-md">
              <label className="excel-label">เลือกปีงบประมาณ</label>
              <select
                className="excel-input excel-input-green mt-1 text-lg"
                value={form.fiscalYear}
                onChange={(event) => setForm((prev) => ({ ...prev, fiscalYear: event.target.value }))}
              >
                <option value="">-- เลือกปีงบประมาณ --</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h3 className="excel-title text-lg">STEP 2: ข้อมูลโรงเรียน (อ่านอย่างเดียว)</h3>
            <p className="excel-hint">ข้อมูลจากการตั้งค่าระบบ</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["ชื่อโรงเรียน", schoolInfo.name],
                    ["ที่อยู่", schoolInfo.address],
                    ["สังกัด", schoolInfo.affiliation],
                    ["จำนวนนักเรียน", schoolInfo.studentCount],
                    ["เจ้าหน้าที่", schoolInfo.officer],
                    ["หัวหน้าเจ้าหน้าที่", schoolInfo.headOfficer],
                    ["เจ้าหน้าที่การเงิน", schoolInfo.financeOfficer],
                    ["ผู้อำนวยการโรงเรียน", schoolInfo.director]
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b border-[var(--excel-border)]">
                      <td className="w-48 py-2 text-slate-600">{label}</td>
                      <td className="py-2">
                        <input
                          className="excel-input excel-input-yellow"
                          value={value}
                          readOnly
                          title="ข้อมูลจากการตั้งค่าระบบ"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h3 className="excel-title text-lg">STEP 3: ข้อมูลคำขอจัดซื้อ/จ้าง</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="excel-label">เลขที่บันทึกข้อความ</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    placeholder="......../2567"
                    value={form.recordNumber}
                    onChange={(event) => setForm((prev) => ({ ...prev, recordNumber: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="excel-label">ประเภทงาน (จัดซื้อ/จัดจ้าง)</label>
                  <select
                    className="excel-input excel-input-green mt-1"
                    value={form.caseType}
                    onChange={(event) => setForm((prev) => ({ ...prev, caseType: event.target.value }))}
                  >
                    <option value="PURCHASE">จัดซื้อ</option>
                    <option value="HIRE">จัดจ้าง</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="excel-label">วันที่บันทึกข้อความรายงานขอซื้อ/จ้าง</label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className="excel-input excel-input-green"
                      value={form.recordDate.day}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, recordDate: { ...prev.recordDate, day: event.target.value } }))
                      }
                    >
                      <option value="">วัน</option>
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <select
                      className="excel-input excel-input-green"
                      value={form.recordDate.month}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          recordDate: { ...prev.recordDate, month: event.target.value }
                        }))
                      }
                    >
                      <option value="">เดือน</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      className="excel-input excel-input-green"
                      value={form.recordDate.year}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          recordDate: { ...prev.recordDate, year: event.target.value }
                        }))
                      }
                    >
                      <option value="">ปี (พ.ศ.)</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="excel-hint mt-1">ตัวอย่าง: 7 พฤศจิกายน 2567</p>
                </div>
                <div>
                  <label className="excel-label">กลุ่มงาน</label>
                  <select
                    className="excel-input excel-input-green mt-1"
                    value={form.department}
                    onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                  >
                    <option value="">เลือกกลุ่มงาน</option>
                    {departmentOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="excel-label">เลือกรหัสโครงการ</label>
                  <select
                    className="excel-input excel-input-green mt-1"
                    value={form.projectCode}
                    onChange={(event) => setForm((prev) => ({ ...prev, projectCode: event.target.value }))}
                  >
                    <option value="">เลือกรหัสโครงการ</option>
                    {projectOptions.map((project) => (
                      <option key={project.code} value={project.code}>
                        {project.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="excel-label">รายการที่จะจัดซื้อ/จ้าง</label>
                  <input className="excel-input excel-input-red mt-1" value={form.projectName} readOnly />
                </div>
                <div>
                  <label className="excel-label">เหตุผลที่จะขอซื้อ/จ้าง</label>
                  <input className="excel-input excel-input-red mt-1" value={form.reason} readOnly />
                </div>
                <div>
                  <label className="excel-label">แผนงาน</label>
                  <input className="excel-input excel-input-red mt-1" value={form.plan} readOnly />
                </div>
                <div>
                  <label className="excel-label">งบประมาณ (บาท)</label>
                  <input className="excel-input excel-input-red mt-1" value={form.budget} readOnly />
                </div>
                <div>
                  <label className="excel-label">กำหนดส่งมอบ (วัน)</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={form.deliveryDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, deliveryDays: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="excel-label">วันที่ส่งมอบงาน</label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className="excel-input excel-input-green"
                      value={form.deliveryDate.day}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          deliveryDate: { ...prev.deliveryDate, day: event.target.value }
                        }))
                      }
                    >
                      <option value="">วัน</option>
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <select
                      className="excel-input excel-input-green"
                      value={form.deliveryDate.month}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          deliveryDate: { ...prev.deliveryDate, month: event.target.value }
                        }))
                      }
                    >
                      <option value="">เดือน</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      className="excel-input excel-input-green"
                      value={form.deliveryDate.year}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          deliveryDate: { ...prev.deliveryDate, year: event.target.value }
                        }))
                      }
                    >
                      <option value="">ปี (พ.ศ.)</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <aside className="excel-instruction space-y-3">
              <h4 className="text-sm font-semibold">คำแนะนำการกรอก</h4>
              <p>เลือกวันเดือนปี ที่จะจัดจ้าง</p>
              <p>เลือกกลุ่มงาน</p>
              <p>เลือกโครงการ</p>
              <p>ช่องสีแดงไม่ต้องแก้ไข</p>
            </aside>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h3 className="excel-title text-lg">STEP 4: คณะกรรมการตรวจรับพัสดุ</h3>
              <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="border px-3 py-2">ตำแหน่ง</th>
                      <th className="border px-3 py-2">ชื่อ-สกุล</th>
                      <th className="border px-3 py-2">หน้าที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committee.map((row, index) => (
                      <tr key={`committee-${index}`}>
                        <td className="border px-2 py-2">
                          <select
                            className="excel-input excel-input-green"
                            value={row.position}
                            onChange={(event) =>
                              setCommittee((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, position: event.target.value } : item
                                )
                              )
                            }
                          >
                            <option value="">เลือกตำแหน่ง</option>
                            {committeePositions.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            className="excel-input excel-input-yellow"
                            value={row.name}
                            onChange={(event) =>
                              setCommittee((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, name: event.target.value } : item
                                )
                              )
                            }
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <select
                            className="excel-input excel-input-green"
                            value={row.role}
                            onChange={(event) =>
                              setCommittee((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, role: event.target.value } : item
                                )
                              )
                            }
                          >
                            {committeeRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <aside className="excel-instruction space-y-3">
              <h4 className="text-sm font-semibold">ตัวอย่างข้อความ</h4>
              <p>ข้อความจะปรากฏในเอกสารคำสั่งแต่งตั้ง</p>
            </aside>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h3 className="excel-title text-lg">STEP 5: เลือกผู้รับจ้าง</h3>
              <div>
                <label className="excel-label">เลือกผู้รับจ้าง</label>
                <select
                  className="excel-input excel-input-green mt-1"
                  value={contractor.vendorId}
                  onChange={(event) =>
                    setContractor((prev) => ({ ...prev, vendorId: event.target.value }))
                  }
                >
                  <option value="">เลือกผู้รับจ้าง</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["ชื่อ", contractor.name],
                  ["ที่อยู่", contractor.address],
                  ["เบอร์โทร", contractor.phone],
                  ["เลขบัตรประชาชน", contractor.citizenId],
                  ["เลขผู้เสียภาษี", contractor.taxId],
                  ["ธนาคาร", contractor.bank],
                  ["เลขบัญชี", contractor.bankAccount]
                ].map(([label, value]) => (
                  <div key={label}>
                    <label className="excel-label">{label}</label>
                    <input
                      className="excel-input excel-input-red mt-1"
                      value={value}
                      readOnly
                      title="ข้อมูลผู้รับจ้าง (ไม่ต้องแก้ไข)"
                    />
                  </div>
                ))}
              </div>
            </div>
            <aside className="excel-instruction space-y-3">
              <h4 className="text-sm font-semibold">หมายเหตุ</h4>
              <p>ข้อมูลผู้รับจ้าง (ไม่ต้องแก้ไข)</p>
            </aside>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4">
            <h3 className="excel-title text-lg">STEP 6: กำหนดวันเอกสาร</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["วันที่ใบเสนอราคา", "quote"],
                ["วันที่ใบสั่งจ้าง", "order"],
                ["วันที่ส่งมอบงาน", "delivery"],
                ["วันที่ตรวจรับพัสดุ", "inspection"],
                ["วันที่ขอเบิกเงิน", "payment"]
              ].map(([label, key]) => {
                const dateKey = key as keyof typeof documentDates;
                const value = documentDates[dateKey];
                return (
                  <div key={label}>
                    <label className="excel-label">{label}</label>
                    <div className="mt-1 grid gap-2 md:grid-cols-3">
                      <select
                        className="excel-input excel-input-green"
                        value={value.day}
                        onChange={(event) => setDateParts(dateKey, { ...value, day: event.target.value })}
                      >
                        <option value="">วัน</option>
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <select
                        className="excel-input excel-input-green"
                        value={value.month}
                        onChange={(event) => setDateParts(dateKey, { ...value, month: event.target.value })}
                      >
                        <option value="">เดือน</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        className="excel-input excel-input-green"
                        value={value.year}
                        onChange={(event) => setDateParts(dateKey, { ...value, year: event.target.value })}
                      >
                        <option value="">ปี (พ.ศ.)</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="excel-hint mt-1">ตัวอย่าง: 7 พฤศจิกายน 2567</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-4">
            <h3 className="excel-title text-lg">FINAL STEP: สั่งพิมพ์เอกสารทั้งหมด</h3>
            <button
              className="excel-button excel-button-primary w-full bg-red-600 hover:bg-red-700"
              type="button"
              disabled={generating || loading}
              onClick={handleGenerate}
            >
              🔴 สั่งพิมพ์เอกสารทั้งหมด
            </button>
            <div className="grid gap-2 md:grid-cols-2">
              {docChecklist.map((item, index) => {
                const done = progressIndex > index;
                return (
                  <div
                    key={item}
                    className={`rounded border px-3 py-2 text-sm ${
                      done ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white"
                    }`}
                  >
                    {done ? "✓" : "○"} {item}
                  </div>
                );
              })}
            </div>
            {successMessage ? (
              <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                {successMessage}
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="flex items-center justify-between">
        <button
          className="excel-button rounded border border-[var(--excel-border)] px-4 py-2"
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
        >
          ย้อนกลับ
        </button>
        <div className="flex items-center gap-3">
          {!fiscalYearSelected && step !== 1 ? (
            <span className="text-sm text-slate-400">กรุณาเลือกปีงบประมาณก่อน</span>
          ) : null}
          {step < stepLabels.length ? (
            <button
              className="excel-button excel-button-primary px-5 py-2"
              type="button"
              onClick={handleNext}
              disabled={!fiscalYearSelected && step !== 1}
            >
              ถัดไป
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
