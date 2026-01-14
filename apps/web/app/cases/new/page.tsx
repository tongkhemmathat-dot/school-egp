
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import type { ProcurementCase, User, Vendor } from "../../../lib/types";

type DateParts = { day: string; month: string; year: string };
type CommitteeRow = { position: string; name: string; role: string };

const baseStepLabels = [
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

const lunchSubtypes = [
  { value: "PREPARED", label: "จ้างเหมาปรุงสำเร็จ" },
  { value: "INGREDIENTS", label: "ซื้อวัตถุดิบ" },
  { value: "INGREDIENTS_COOK", label: "ซื้อวัตถุดิบ + จ้างแม่ครัว" }
];

const internetSubtypes = [
  { value: "LEASE", label: "เช่าอินเทอร์เน็ต" },
  { value: "PURCHASE", label: "ซื้ออินเทอร์เน็ต" }
];

const paymentScheduleOptions = ["ทุก 2 สัปดาห์", "ทุกวัน", "ทุกสัปดาห์", "ทุกสิ้นเดือน"];

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
  const [infoTab, setInfoTab] = useState<"school" | "staff" | "contractor">("school");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStep, setValidationStep] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const [schoolInfo, setSchoolInfo] = useState({
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
    subtype: "",
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

  const [foodCommittee, setFoodCommittee] = useState<CommitteeRow[]>([
    { position: "", name: "", role: "ประธาน" },
    { position: "", name: "", role: "กรรมการ" },
    { position: "", name: "", role: "กรรมการ" }
  ]);

  const [contractor, setContractor] = useState({
    code: "",
    vendorId: "",
    name: "",
    address: "",
    phone: "",
    citizenId: "",
    taxId: "",
    bank: "",
    bankAccount: "",
    bankAccountName: "",
    bankBranch: ""
  });

  const [lunchExtra, setLunchExtra] = useState({
    headOrgPosition: "",
    actingPosition: "",
    lunchOfficerPosition: "",
    deputyDirector: "",
    lunchOfficer: "",
    foodSupervisor: "",
    municipality: "",
    schoolTaxId: "",
    schoolPhone: "",
    memoType: "",
    foodType: "อาหารกลางวัน",
    semester: "",
    academicYear: "",
    gradeLevel: "",
    mealDays: "",
    mealStudentCount: "",
    mealStartDate: emptyDate(),
    mealEndDate: emptyDate(),
    quoteValidDays: "",
    quoteValidUntilDate: emptyDate(),
    bidSubmitEndDate: emptyDate(),
    winnerAnnounceDate: emptyDate(),
    approvalNumber: "",
    approvalDate: emptyDate(),
    paymentSchedule: "",
    paymentEveryDays: "",
    contractorCount: "",
    wagePerDay: "",
    totalWage: "",
    withholdingTax: "หัก"
  });

  const [lunchDocNumbers, setLunchDocNumbers] = useState({
    committeeOrderNumber: "",
    committeeOrderDate: emptyDate(),
    reportNumber: "",
    reportDate: emptyDate(),
    quoteNumber: "",
    purchaseOrderNumber: "",
    deliveryNoteNumber: "",
    paymentNoteNumber: ""
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
    Promise.allSettled([
      apiFetch<Vendor[]>("admin/vendors"),
      apiFetch("admin/organization"),
      apiFetch<User[]>("admin/users")
    ]).then((results) => {
      if (!active) return;
      const [vendorResult, orgResult, userResult] = results;
      if (vendorResult.status === "fulfilled") {
        setVendors(vendorResult.value);
      }
      if (orgResult.status === "fulfilled") {
        const orgData = orgResult.value as any;
        setSchoolInfo((prev) => ({
          ...prev,
          name: orgData?.name || prev.name,
          address: orgData?.address || prev.address,
          affiliation: orgData?.affiliation || prev.affiliation,
          studentCount: orgData?.studentCount?.toString() || prev.studentCount,
          officer: orgData?.officerName || prev.officer,
          headOfficer: orgData?.headOfficerName || prev.headOfficer,
          financeOfficer: orgData?.financeOfficerName || prev.financeOfficer,
          director: orgData?.directorName || prev.director
        }));
      }
      if (userResult.status === "fulfilled") {
        setStaffUsers(userResult.value);
      }
    });
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
        code: "",
        name: "",
        address: "",
        phone: "",
        taxId: "",
        citizenId: "",
        bank: "",
        bankAccount: "",
        bankAccountName: "",
        bankBranch: ""
      }));
      return;
    }
    setContractor((prev) => ({
      ...prev,
      code: match.code || "",
      name: match.name || "",
      address: match.address || "",
      phone: match.phone || "",
      taxId: match.taxId || "",
      citizenId: match.citizenId || "",
      bank: match.bankName || "",
      bankAccount: match.bankAccount || "",
      bankAccountName: match.bankAccountName || "",
      bankBranch: match.bankBranch || ""
    }));
  }, [contractor.vendorId, vendors]);

  useEffect(() => {
    if (!lunchExtra.mealStudentCount && schoolInfo.studentCount && schoolInfo.studentCount !== "รอการตั้งค่าระบบ") {
      setLunchExtra((prev) => ({ ...prev, mealStudentCount: schoolInfo.studentCount }));
    }
  }, [schoolInfo.studentCount, lunchExtra.mealStudentCount]);

  useEffect(() => {
    const days = Number(lunchExtra.mealDays);
    const wage = Number(lunchExtra.wagePerDay);
    if (!lunchExtra.totalWage && days > 0 && wage > 0) {
      setLunchExtra((prev) => ({ ...prev, totalWage: (days * wage).toString() }));
    }
  }, [lunchExtra.mealDays, lunchExtra.wagePerDay, lunchExtra.totalWage]);

  const yearOptions = useMemo(() => buildThaiYears(), []);
  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, idx) => `${idx + 1}`), []);
  const stepLabels = useMemo(() => {
    if (form.caseType === "LUNCH") {
      return [
        "เลือกปีงบประมาณ",
        "ข้อมูลโรงเรียน",
        "ข้อมูลอาหารกลางวัน",
        "คณะกรรมการ",
        "ข้อมูลผู้รับจ้าง",
        "กำหนดวันเอกสาร",
        "สั่งพิมพ์เอกสาร"
      ];
    }
    return baseStepLabels;
  }, [form.caseType]);

  const fiscalYearSelected = Boolean(form.fiscalYear);

  const stepCompleted = (index: number) => step > index;

  const showStep1Errors = validationStep === 1;
  const showStep2Errors = validationStep === 2;
  const showStep3Errors = validationStep === 3;
  const showStep4Errors = validationStep === 4;
  const showStep5Errors = validationStep === 5;
  const showStep6Errors = validationStep === 6;

  const contractorMissing = showStep5Errors && !contractor.vendorId && !contractor.name.trim();
  const contractorCodeMissing = showStep5Errors && form.caseType === "LUNCH" && !contractor.code;

  const setDateParts = (key: keyof typeof documentDates, value: DateParts) => {
    setDocumentDates((prev) => ({ ...prev, [key]: value }));
  };

  const isDateComplete = (date: DateParts) => Boolean(date.day && date.month && date.year);

  const isBlank = (value: string) => !value || value.trim() === "" || value.trim() === "รอการตั้งค่าระบบ";

  const requiredMark = <span className="text-red-600"> *</span>;

  const getInputClass = (variant: "yellow" | "green", missing: boolean) =>
    `excel-input ${missing ? "excel-input-red" : variant === "yellow" ? "excel-input-yellow" : "excel-input-green"}`;

  const staffNameOptions = useMemo(() => {
    const names = new Set<string>();
    staffUsers.forEach((user) => {
      if (user.name && user.name.trim()) names.add(user.name.trim());
    });
    [schoolInfo.officer, schoolInfo.headOfficer, schoolInfo.financeOfficer, schoolInfo.director].forEach((name) => {
      if (!isBlank(name)) names.add(name.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, "th"));
  }, [staffUsers, schoolInfo]);

  const validateStep = (current: number) => {
    if (current === 1) {
      if (!form.fiscalYear) return "กรุณาเลือกปีงบประมาณ";
      if ((form.caseType === "LUNCH" || form.caseType === "INTERNET") && !form.subtype) {
        return "กรุณาเลือกประเภทงานย่อย";
      }
      return null;
    }
    if (current === 2) {
      const schoolMissing = ["name", "address", "affiliation", "studentCount"].some((key) =>
        isBlank(schoolInfo[key as keyof typeof schoolInfo])
      );
      const staffMissing = ["officer", "headOfficer", "financeOfficer", "director"].some((key) =>
        isBlank(schoolInfo[key as keyof typeof schoolInfo])
      );
      if (schoolMissing || staffMissing) return "กรุณากรอกข้อมูลให้ครบถ้วน";
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
      if (form.caseType === "LUNCH") {
        if (
          !lunchExtra.semester ||
          !lunchExtra.academicYear ||
          !lunchExtra.mealDays ||
          !lunchExtra.mealStudentCount ||
          !isDateComplete(lunchExtra.mealStartDate) ||
          !isDateComplete(lunchExtra.mealEndDate)
        ) {
          return "กรุณากรอกข้อมูลอาหารกลางวันให้ครบถ้วน";
        }
      }
    }
    if (current === 4) {
      const valid = committee.every((row) => row.position && row.name);
      if (!valid) return "กรุณากรอกข้อมูลให้ครบถ้วน";
      if (form.caseType === "LUNCH") {
        const foodValid = foodCommittee.every((row) => row.position && row.name);
        if (!foodValid) return "กรุณากรอกข้อมูลให้ครบถ้วน";
      }
    }
    if (current === 5) {
      if (!contractor.vendorId && !contractor.name.trim()) {
        return "กรุณากรอกข้อมูลให้ครบถ้วน";
      }
      if (form.caseType === "LUNCH" && !contractor.code) {
        return "กรุณากรอกรหัสผู้รับจ้าง";
      }
    }
    if (current === 6) {
      const valid = Object.values(documentDates).every((date) => isDateComplete(date));
      if (!valid) return "กรุณากรอกข้อมูลให้ครบถ้วน";
      if (form.caseType === "LUNCH") {
        if (
          !lunchDocNumbers.committeeOrderNumber ||
          !isDateComplete(lunchDocNumbers.committeeOrderDate) ||
          !lunchDocNumbers.reportNumber ||
          !isDateComplete(lunchDocNumbers.reportDate)
        ) {
          return "กรุณากรอกข้อมูลเอกสารให้ครบถ้วน";
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      setValidationStep(step);
      return;
    }
    setError(null);
    setValidationStep(null);
    setStep((prev) => Math.min(prev + 1, stepLabels.length));
  };

  const handlePrev = () => {
    setError(null);
    setValidationStep(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const buildLunchMeta = () => ({
    school_name: schoolInfo.name,
    school_address: schoolInfo.address,
    school_affiliation: schoolInfo.affiliation,
    school_student_count: lunchExtra.mealStudentCount || schoolInfo.studentCount,
    school_officer_name: schoolInfo.officer,
    school_head_officer_name: schoolInfo.headOfficer,
    school_finance_officer_name: schoolInfo.financeOfficer,
    school_director_name: schoolInfo.director,
    record_number: form.recordNumber,
    record_date_day: form.recordDate.day,
    record_date_month: form.recordDate.month,
    record_date_year: form.recordDate.year,
    department: form.department,
    project_code: form.projectCode,
    delivery_days: form.deliveryDays,
    delivery_date_day: form.deliveryDate.day,
    delivery_date_month: form.deliveryDate.month,
    delivery_date_year: form.deliveryDate.year,
    committee_chair_name: committee[0]?.name || "",
    committee_chair_position: committee[0]?.position || "",
    committee_member1_name: committee[1]?.name || "",
    committee_member1_position: committee[1]?.position || "",
    committee_member2_name: committee[2]?.name || "",
    committee_member2_position: committee[2]?.position || "",
    committee_order_number: lunchDocNumbers.committeeOrderNumber,
    committee_order_date_day: lunchDocNumbers.committeeOrderDate.day,
    committee_order_date_month: lunchDocNumbers.committeeOrderDate.month,
    committee_order_date_year: lunchDocNumbers.committeeOrderDate.year,
    report_number: lunchDocNumbers.reportNumber,
    report_date_day: lunchDocNumbers.reportDate.day,
    report_date_month: lunchDocNumbers.reportDate.month,
    report_date_year: lunchDocNumbers.reportDate.year,
    contractor_code: contractor.code,
    quote_number: lunchDocNumbers.quoteNumber,
    quote_date_day: documentDates.quote.day,
    quote_date_month: documentDates.quote.month,
    quote_date_year: documentDates.quote.year,
    quote_price: lunchExtra.totalWage || form.budget,
    quote_item_count: lunchExtra.contractorCount || "1",
    quote_item_unit: "คน",
    purchase_order_number: lunchDocNumbers.purchaseOrderNumber,
    purchase_order_date_day: documentDates.order.day,
    purchase_order_date_month: documentDates.order.month,
    purchase_order_date_year: documentDates.order.year,
    delivery_note_number: lunchDocNumbers.deliveryNoteNumber,
    delivery_note_date_day: documentDates.delivery.day,
    delivery_note_date_month: documentDates.delivery.month,
    delivery_note_date_year: documentDates.delivery.year,
    inspection_date_day: documentDates.inspection.day,
    inspection_date_month: documentDates.inspection.month,
    inspection_date_year: documentDates.inspection.year,
    payment_note_number: lunchDocNumbers.paymentNoteNumber,
    payment_date_day: documentDates.payment.day,
    payment_date_month: documentDates.payment.month,
    payment_date_year: documentDates.payment.year,
    head_org_position: lunchExtra.headOrgPosition,
    acting_position: lunchExtra.actingPosition,
    lunch_officer_position: lunchExtra.lunchOfficerPosition,
    deputy_director_name: lunchExtra.deputyDirector,
    lunch_officer_name: lunchExtra.lunchOfficer,
    food_supervisor_name: lunchExtra.foodSupervisor,
    municipality_name: lunchExtra.municipality,
    school_tax_id: lunchExtra.schoolTaxId,
    school_phone: lunchExtra.schoolPhone,
    memo_type: lunchExtra.memoType,
    food_type: lunchExtra.foodType,
    semester: lunchExtra.semester,
    academic_year: lunchExtra.academicYear,
    grade_level: lunchExtra.gradeLevel,
    meal_days: lunchExtra.mealDays,
    meal_student_count: lunchExtra.mealStudentCount,
    meal_start_date_day: lunchExtra.mealStartDate.day,
    meal_start_date_month: lunchExtra.mealStartDate.month,
    meal_start_date_year: lunchExtra.mealStartDate.year,
    meal_end_date_day: lunchExtra.mealEndDate.day,
    meal_end_date_month: lunchExtra.mealEndDate.month,
    meal_end_date_year: lunchExtra.mealEndDate.year,
    quote_valid_days: lunchExtra.quoteValidDays,
    quote_valid_until_day: lunchExtra.quoteValidUntilDate.day,
    quote_valid_until_month: lunchExtra.quoteValidUntilDate.month,
    quote_valid_until_year: lunchExtra.quoteValidUntilDate.year,
    bid_submit_end_date_day: lunchExtra.bidSubmitEndDate.day,
    bid_submit_end_date_month: lunchExtra.bidSubmitEndDate.month,
    bid_submit_end_date_year: lunchExtra.bidSubmitEndDate.year,
    winner_announce_date_day: lunchExtra.winnerAnnounceDate.day,
    winner_announce_date_month: lunchExtra.winnerAnnounceDate.month,
    winner_announce_date_year: lunchExtra.winnerAnnounceDate.year,
    approval_number: lunchExtra.approvalNumber,
    approval_date_day: lunchExtra.approvalDate.day,
    approval_date_month: lunchExtra.approvalDate.month,
    approval_date_year: lunchExtra.approvalDate.year,
    payment_schedule: lunchExtra.paymentSchedule,
    payment_every_days: lunchExtra.paymentEveryDays,
    contractor_count: lunchExtra.contractorCount,
    wage_per_day: lunchExtra.wagePerDay,
    total_wage: lunchExtra.totalWage,
    withholding_tax: lunchExtra.withholdingTax,
    food_committee_chair_name: foodCommittee[0]?.name || "",
    food_committee_chair_position: foodCommittee[0]?.position || "",
    food_committee_member1_name: foodCommittee[1]?.name || "",
    food_committee_member1_position: foodCommittee[1]?.position || "",
    food_committee_member2_name: foodCommittee[2]?.name || "",
    food_committee_member2_position: foodCommittee[2]?.position || ""
  });

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
      const isLunch = form.caseType === "LUNCH";
      const needsSubtype = form.caseType === "LUNCH" || form.caseType === "INTERNET";
      const payload = {
        title:
          isLunch
            ? `อาหารกลางวัน ${lunchExtra.gradeLevel || ""}`.trim()
            : form.projectName || "งานจัดซื้อ/จัดจ้าง",
        reason: form.reason || null,
        caseType: form.caseType,
        subtype: needsSubtype ? form.subtype || null : null,
        budgetAmount: isLunch ? Number(lunchExtra.totalWage || form.budget) || 0 : Number(form.budget) || 0,
        fiscalYear: Number(form.fiscalYear),
        desiredDate: toIsoDate(form.deliveryDate),
        vendorId: contractor.vendorId || null,
        isBackdated: false,
        backdateReason: null,
        lunchMeta: isLunch ? buildLunchMeta() : undefined,
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
            <div className="max-w-md space-y-4">
              <div>
                <label className="excel-label">
                  เลือกปีงบประมาณ{requiredMark}
                </label>
                <select
                  className={`${getInputClass("green", showStep1Errors && !form.fiscalYear)} mt-1 text-lg`}
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
              <div>
                <label className="excel-label">ประเภทงาน</label>
                <select
                  className="excel-input excel-input-green mt-1"
                  value={form.caseType}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      caseType: event.target.value,
                      subtype: event.target.value === "LUNCH" ? prev.subtype : ""
                    }))
                  }
                >
                  <option value="PURCHASE">จัดซื้อ</option>
                  <option value="HIRE">จัดจ้าง</option>
                  <option value="LUNCH">อาหารกลางวัน</option>
                  <option value="INTERNET">อินเทอร์เน็ต</option>
                </select>
              </div>
              {(form.caseType === "LUNCH" || form.caseType === "INTERNET") ? (
                <div>
                  <label className="excel-label">
                    {form.caseType === "LUNCH" ? "รูปแบบอาหารกลางวัน" : "รูปแบบอินเทอร์เน็ต"}
                    {requiredMark}
                  </label>
                  <select
                    className={`${getInputClass("green", showStep1Errors && !form.subtype)} mt-1`}
                    value={form.subtype}
                    onChange={(event) => setForm((prev) => ({ ...prev, subtype: event.target.value }))}
                  >
                    <option value="">
                      {form.caseType === "LUNCH" ? "เลือกรูปแบบอาหารกลางวัน" : "เลือกรูปแบบอินเทอร์เน็ต"}
                    </option>
                    {(form.caseType === "LUNCH" ? lunchSubtypes : internetSubtypes).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="excel-title text-lg">STEP 2: ข้อมูลโรงเรียนและบุคลากร</h3>
              <p className="excel-hint">ข้อมูลจากการตั้งค่าระบบ (แก้ไขได้)</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                ["school", "ข้อมูลโรงเรียน"],
                ["staff", "บุคลากร"],
                ["contractor", "ข้อมูลผู้รับจ้าง"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`rounded border px-3 py-1 ${
                    infoTab === key
                      ? "border-[var(--excel-accent)] bg-[var(--excel-green)] font-semibold"
                      : "border-[var(--excel-border)] bg-white text-slate-600"
                  }`}
                  onClick={() => setInfoTab(key as "school" | "staff" | "contractor")}
                >
                  {label}
                </button>
              ))}
            </div>

            {infoTab === "school" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["ชื่อโรงเรียน", "name", true],
                      ["ที่อยู่", "address", true],
                      ["สังกัด", "affiliation", true],
                      ["จำนวนนักเรียน", "studentCount", true]
                    ].map(([label, key, required]) => {
                      const missing =
                        showStep2Errors && isBlank(schoolInfo[key as keyof typeof schoolInfo]);
                      return (
                        <tr key={label} className="border-b border-[var(--excel-border)]">
                          <td className="w-48 py-2 text-slate-600">
                            {label}
                            {required ? requiredMark : null}
                          </td>
                        <td className="py-2">
                          <input
                            className={getInputClass("yellow", missing)}
                            value={schoolInfo[key as keyof typeof schoolInfo]}
                            onChange={(event) =>
                              setSchoolInfo((prev) => ({ ...prev, [key]: event.target.value }))
                            }
                            title="ข้อมูลจากการตั้งค่าระบบ"
                          />
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {infoTab === "staff" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["เจ้าหน้าที่", "officer", true],
                      ["หัวหน้าเจ้าหน้าที่", "headOfficer", true],
                      ["เจ้าหน้าที่การเงิน", "financeOfficer", true],
                      ["ผู้อำนวยการโรงเรียน", "director", true]
                    ].map(([label, key, required]) => {
                      const missing =
                        showStep2Errors && isBlank(schoolInfo[key as keyof typeof schoolInfo]);
                      return (
                        <tr key={label} className="border-b border-[var(--excel-border)]">
                          <td className="w-48 py-2 text-slate-600">
                            {label}
                            {required ? requiredMark : null}
                          </td>
                        <td className="py-2">
                          <input
                            className={getInputClass("yellow", missing)}
                            value={schoolInfo[key as keyof typeof schoolInfo]}
                            onChange={(event) =>
                              setSchoolInfo((prev) => ({ ...prev, [key]: event.target.value }))
                            }
                            title="ข้อมูลจากการตั้งค่าระบบ"
                          />
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {infoTab === "contractor" ? (
              <div className="space-y-3">
                <div>
                  <label className="excel-label">เลือกผู้รับจ้าง (จากรายการ)</label>
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
                  <p className="excel-hint mt-1">หากไม่มีในรายการ สามารถกรอกข้อมูลเองได้</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["รหัสผู้รับเหมา", "code"],
                    ["ชื่อ", "name"],
                    ["ที่อยู่", "address"],
                    ["เบอร์โทร", "phone"],
                    ["เลขบัตรประชาชน", "citizenId"],
                    ["เลขผู้เสียภาษี", "taxId"],
                    ["เลขที่บัญชีธนาคาร", "bankAccount"],
                    ["ชื่อบัญชี", "bankAccountName"],
                    ["ธนาคาร", "bank"],
                    ["สาขา", "bankBranch"]
                  ].map(([label, key]) => (
                    <div key={label}>
                      <label className="excel-label">{label}</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={contractor[key as keyof typeof contractor]}
                        onChange={(event) =>
                          setContractor((prev) => ({ ...prev, [key]: event.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h3 className="excel-title text-lg">
                STEP 3: {form.caseType === "LUNCH" ? "ข้อมูลอาหารกลางวัน" : "ข้อมูลคำขอจัดซื้อ/จ้าง"}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="excel-label">
                    เลขที่บันทึกข้อความ{requiredMark}
                  </label>
                  <input
                    className={`${getInputClass("yellow", showStep3Errors && !form.recordNumber)} mt-1`}
                    placeholder="......../2567"
                    value={form.recordNumber}
                    onChange={(event) => setForm((prev) => ({ ...prev, recordNumber: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="excel-label">ประเภทงาน</label>
                  <select
                    className="excel-input excel-input-green mt-1"
                    value={form.caseType}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        caseType: event.target.value,
                        subtype: event.target.value === "LUNCH" ? prev.subtype : ""
                      }))
                    }
                  >
                    <option value="PURCHASE">จัดซื้อ</option>
                    <option value="HIRE">จัดจ้าง</option>
                    <option value="LUNCH">อาหารกลางวัน</option>
                    <option value="INTERNET">อินเทอร์เน็ต</option>
                  </select>
                </div>
                {(form.caseType === "LUNCH" || form.caseType === "INTERNET") ? (
                  <div>
                    <label className="excel-label">
                      {form.caseType === "LUNCH" ? "รูปแบบอาหารกลางวัน" : "รูปแบบอินเทอร์เน็ต"}
                      {requiredMark}
                    </label>
                    <select
                      className={`${getInputClass("green", showStep3Errors && !form.subtype)} mt-1`}
                      value={form.subtype}
                      onChange={(event) => setForm((prev) => ({ ...prev, subtype: event.target.value }))}
                    >
                      <option value="">
                        {form.caseType === "LUNCH" ? "เลือกรูปแบบอาหารกลางวัน" : "เลือกรูปแบบอินเทอร์เน็ต"}
                      </option>
                      {(form.caseType === "LUNCH" ? lunchSubtypes : internetSubtypes).map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <label className="excel-label">
                    วันที่บันทึกข้อความรายงานขอซื้อ/จ้าง{requiredMark}
                  </label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className={getInputClass("green", showStep3Errors && !isDateComplete(form.recordDate))}
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
                      className={getInputClass("green", showStep3Errors && !isDateComplete(form.recordDate))}
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
                      className={getInputClass("green", showStep3Errors && !isDateComplete(form.recordDate))}
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
                  <label className="excel-label">
                    กลุ่มงาน{requiredMark}
                  </label>
                  <select
                    className={`${getInputClass("green", showStep3Errors && !form.department)} mt-1`}
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
                  <label className="excel-label">
                    เลือกรหัสโครงการ{requiredMark}
                  </label>
                  <select
                    className={`${getInputClass("green", showStep3Errors && !form.projectCode)} mt-1`}
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
                  <label className="excel-label">
                    กำหนดส่งมอบ (วัน){requiredMark}
                  </label>
                  <input
                    className={`${getInputClass("yellow", showStep3Errors && !form.deliveryDays)} mt-1`}
                    value={form.deliveryDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, deliveryDays: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="excel-label">
                    วันที่ส่งมอบงาน{requiredMark}
                  </label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className={getInputClass("green", showStep3Errors && !isDateComplete(form.deliveryDate))}
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
                      className={getInputClass("green", showStep3Errors && !isDateComplete(form.deliveryDate))}
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
                      className={getInputClass("green", showStep3Errors && !isDateComplete(form.deliveryDate))}
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
                {form.caseType === "LUNCH" ? (
                  <>
                    <div className="md:col-span-2 mt-2 border-t border-[var(--excel-border)] pt-4">
                      <h4 className="text-sm font-semibold text-slate-700">ข้อมูลอาหารกลางวัน</h4>
                      <p className="excel-hint mt-1">กรอกข้อมูลสำหรับโครงการอาหารกลางวันตามแบบ egpeasy</p>
                    </div>
                    <div>
                      <label className="excel-label">ประเภทอาหาร</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.foodType}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, foodType: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">
                        ภาคเรียนที่{requiredMark}
                      </label>
                      <select
                        className={`${getInputClass("green", showStep3Errors && !lunchExtra.semester)} mt-1`}
                        value={lunchExtra.semester}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, semester: event.target.value }))
                        }
                      >
                        <option value="">เลือกภาคเรียน</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                    <div>
                      <label className="excel-label">
                        ปีการศึกษา{requiredMark}
                      </label>
                      <select
                        className={`${getInputClass("green", showStep3Errors && !lunchExtra.academicYear)} mt-1`}
                        value={lunchExtra.academicYear}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, academicYear: event.target.value }))
                        }
                      >
                        <option value="">เลือกปีการศึกษา</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="excel-label">ระดับชั้นที่ใช้งบประมาณ</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.gradeLevel}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, gradeLevel: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">
                        จำนวนวันประกอบอาหาร/วัน{requiredMark}
                      </label>
                      <input
                        className={`${getInputClass("yellow", showStep3Errors && !lunchExtra.mealDays)} mt-1`}
                        value={lunchExtra.mealDays}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, mealDays: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">
                        จำนวนนักเรียน/คน{requiredMark}
                      </label>
                      <input
                        className={`${getInputClass("yellow", showStep3Errors && !lunchExtra.mealStudentCount)} mt-1`}
                        value={lunchExtra.mealStudentCount}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, mealStudentCount: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="excel-label">
                        ประกอบอาหารตั้งแต่วันที่{requiredMark}
                      </label>
                      <div className="mt-1 grid gap-2 md:grid-cols-3">
                        <select
                          className={getInputClass(
                            "green",
                            showStep3Errors && !isDateComplete(lunchExtra.mealStartDate)
                          )}
                          value={lunchExtra.mealStartDate.day}
                          onChange={(event) =>
                            setLunchExtra((prev) => ({
                              ...prev,
                              mealStartDate: { ...prev.mealStartDate, day: event.target.value }
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
                          className={getInputClass(
                            "green",
                            showStep3Errors && !isDateComplete(lunchExtra.mealStartDate)
                          )}
                          value={lunchExtra.mealStartDate.month}
                          onChange={(event) =>
                            setLunchExtra((prev) => ({
                              ...prev,
                              mealStartDate: { ...prev.mealStartDate, month: event.target.value }
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
                          className={getInputClass(
                            "green",
                            showStep3Errors && !isDateComplete(lunchExtra.mealStartDate)
                          )}
                          value={lunchExtra.mealStartDate.year}
                          onChange={(event) =>
                            setLunchExtra((prev) => ({
                              ...prev,
                              mealStartDate: { ...prev.mealStartDate, year: event.target.value }
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
                    <div className="md:col-span-2">
                      <label className="excel-label">
                        ถึงวันที่{requiredMark}
                      </label>
                      <div className="mt-1 grid gap-2 md:grid-cols-3">
                        <select
                          className={getInputClass(
                            "green",
                            showStep3Errors && !isDateComplete(lunchExtra.mealEndDate)
                          )}
                          value={lunchExtra.mealEndDate.day}
                          onChange={(event) =>
                            setLunchExtra((prev) => ({
                              ...prev,
                              mealEndDate: { ...prev.mealEndDate, day: event.target.value }
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
                          className={getInputClass(
                            "green",
                            showStep3Errors && !isDateComplete(lunchExtra.mealEndDate)
                          )}
                          value={lunchExtra.mealEndDate.month}
                          onChange={(event) =>
                            setLunchExtra((prev) => ({
                              ...prev,
                              mealEndDate: { ...prev.mealEndDate, month: event.target.value }
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
                          className={getInputClass(
                            "green",
                            showStep3Errors && !isDateComplete(lunchExtra.mealEndDate)
                          )}
                          value={lunchExtra.mealEndDate.year}
                          onChange={(event) =>
                            setLunchExtra((prev) => ({
                              ...prev,
                              mealEndDate: { ...prev.mealEndDate, year: event.target.value }
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
                    <div className="md:col-span-2 mt-2 border-t border-[var(--excel-border)] pt-4">
                      <h4 className="text-sm font-semibold text-slate-700">ข้อมูลหน่วยงานเพิ่มเติม</h4>
                    </div>
                    <div>
                      <label className="excel-label">ตำแหน่งหัวหน้าหน่วยงาน</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.headOrgPosition}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, headOrgPosition: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">รักษาการในตำแหน่งอะไร</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.actingPosition}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, actingPosition: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="excel-label">ตำแหน่งผู้ดำเนินงาน/เจ้าหน้าที่อาหารกลางวัน</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.lunchOfficerPosition}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({
                            ...prev,
                            lunchOfficerPosition: event.target.value
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">รองผู้อำนวยการ</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.deputyDirector}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, deputyDirector: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">เจ้าหน้าที่อาหารกลางวัน</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.lunchOfficer}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, lunchOfficer: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">ผู้ควบคุมการประกอบอาหาร</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.foodSupervisor}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, foodSupervisor: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">หน่วยงานเทศบาล/อบต</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.municipality}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, municipality: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">เลขผู้เสียภาษี</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.schoolTaxId}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, schoolTaxId: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="excel-label">โทรศัพท์</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.schoolPhone}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, schoolPhone: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="excel-label">เลือกคำบันทึกข้อความ</label>
                      <input
                        className="excel-input excel-input-yellow mt-1"
                        value={lunchExtra.memoType}
                        onChange={(event) =>
                          setLunchExtra((prev) => ({ ...prev, memoType: event.target.value }))
                        }
                        placeholder="ตัวอย่าง: รายงานขอจ้างบุคคลเพื่อประกอบอาหาร"
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <aside className="excel-instruction space-y-3">
              <h4 className="text-sm font-semibold">คำแนะนำการกรอก</h4>
              {form.caseType === "LUNCH" ? (
                <>
                  <p>พิมพ์ประเภทอาหาร และช่วงเวลาประกอบอาหารให้ครบ</p>
                  <p>ระบุจำนวนวันและจำนวนนักเรียนตามงบประมาณ</p>
                  <p>ข้อมูลเพิ่มเติมใช้สำหรับเอกสารอาหารกลางวัน</p>
                </>
              ) : (
                <>
                  <p>เลือกวันเดือนปี ที่จะจัดจ้าง</p>
                  <p>เลือกกลุ่มงาน</p>
                  <p>เลือกโครงการ</p>
                  <p>ช่องสีแดงไม่ต้องแก้ไข</p>
                </>
              )}
            </aside>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <h3 className="excel-title text-lg">
                STEP 4: {form.caseType === "LUNCH" ? "คณะกรรมการตรวจรับ" : "คณะกรรมการตรวจรับพัสดุ"}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="border px-3 py-2">
                        ตำแหน่ง<span className="text-red-600"> *</span>
                      </th>
                      <th className="border px-3 py-2">
                        ชื่อ-สกุล<span className="text-red-600"> *</span>
                      </th>
                      <th className="border px-3 py-2">หน้าที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committee.map((row, index) => (
                      <tr key={`committee-${index}`}>
                        <td className="border px-2 py-2">
                          <select
                            className={getInputClass("green", showStep4Errors && !row.position)}
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
                          <select
                            className={getInputClass("green", showStep4Errors && !row.name)}
                            value={row.name}
                            onChange={(event) =>
                              setCommittee((prev) =>
                                prev.map((item, idx) =>
                                  idx === index ? { ...item, name: event.target.value } : item
                                )
                              )
                            }
                          >
                            <option value="">เลือกบุคลากร</option>
                            {staffNameOptions.length === 0 ? (
                              <option value="" disabled>
                                ไม่มีรายชื่อบุคลากร
                              </option>
                            ) : null}
                            {staffNameOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
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
              {form.caseType === "LUNCH" ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">คณะกรรมการตรวจการประกอบอาหาร</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                      <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                          <th className="border px-3 py-2">
                            ตำแหน่ง<span className="text-red-600"> *</span>
                          </th>
                          <th className="border px-3 py-2">
                            ชื่อ-สกุล<span className="text-red-600"> *</span>
                          </th>
                          <th className="border px-3 py-2">หน้าที่</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foodCommittee.map((row, index) => (
                          <tr key={`food-committee-${index}`}>
                            <td className="border px-2 py-2">
                              <select
                                className={getInputClass("green", showStep4Errors && !row.position)}
                                value={row.position}
                                onChange={(event) =>
                                  setFoodCommittee((prev) =>
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
                              <select
                                className={getInputClass("green", showStep4Errors && !row.name)}
                                value={row.name}
                                onChange={(event) =>
                                  setFoodCommittee((prev) =>
                                    prev.map((item, idx) =>
                                      idx === index ? { ...item, name: event.target.value } : item
                                    )
                                  )
                                }
                              >
                                <option value="">เลือกบุคลากร</option>
                                {staffNameOptions.length === 0 ? (
                                  <option value="" disabled>
                                    ไม่มีรายชื่อบุคลากร
                                  </option>
                                ) : null}
                                {staffNameOptions.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border px-2 py-2">
                              <select
                                className="excel-input excel-input-green"
                                value={row.role}
                                onChange={(event) =>
                                  setFoodCommittee((prev) =>
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
              ) : null}
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
                <label className="excel-label">
                  เลือกผู้รับจ้าง{requiredMark}
                </label>
                <select
                  className={`${getInputClass("green", contractorMissing)} mt-1`}
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
                  ["เลขที่บัญชีธนาคาร", contractor.bankAccount],
                  ["ชื่อบัญชี", contractor.bankAccountName],
                  ["ธนาคาร", contractor.bank],
                  ["สาขา", contractor.bankBranch]
                ].map(([label, value]) => (
                  <div key={label}>
                    <label className="excel-label">{label}</label>
                    <input
                      className="excel-input excel-input-red mt-1"
                      value={value}
                      readOnly
                      title="ข้อมูลผู้รับจ้าง (แก้ไขในแท็บข้อมูลผู้รับจ้าง)"
                    />
                  </div>
                ))}
              </div>
              {form.caseType === "LUNCH" ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="excel-label">
                      รหัสผู้รับจ้าง{requiredMark}
                    </label>
                    <input
                      className={`${getInputClass("yellow", contractorCodeMissing)} mt-1`}
                      value={contractor.code}
                      onChange={(event) =>
                        setContractor((prev) => ({ ...prev, code: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="excel-label">การชำระเงินผู้ว่าจ้าง</label>
                    <select
                      className="excel-input excel-input-green mt-1"
                      value={lunchExtra.paymentSchedule}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({ ...prev, paymentSchedule: event.target.value }))
                      }
                    >
                      <option value="">เลือกรูปแบบการชำระเงิน</option>
                      {paymentScheduleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="excel-label">ทุกกี่วันทำการประกอบอาหาร</label>
                    <input
                      className="excel-input excel-input-yellow mt-1"
                      value={lunchExtra.paymentEveryDays}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({ ...prev, paymentEveryDays: event.target.value }))
                      }
                      placeholder="เช่น 10"
                    />
                  </div>
                  <div>
                    <label className="excel-label">จำนวนผู้รับจ้าง</label>
                    <input
                      className="excel-input excel-input-yellow mt-1"
                      value={lunchExtra.contractorCount}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({ ...prev, contractorCount: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="excel-label">ค่าจ้าง (บาท)</label>
                    <input
                      className="excel-input excel-input-yellow mt-1"
                      value={lunchExtra.wagePerDay}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({ ...prev, wagePerDay: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="excel-label">คิดเป็นเงินทั้งสิ้น (บาท)</label>
                    <input
                      className="excel-input excel-input-yellow mt-1"
                      value={lunchExtra.totalWage}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({ ...prev, totalWage: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="excel-label">หักภาษี ณ ที่จ่าย</label>
                    <select
                      className="excel-input excel-input-green mt-1"
                      value={lunchExtra.withholdingTax}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({ ...prev, withholdingTax: event.target.value }))
                      }
                    >
                      <option value="หัก">หัก</option>
                      <option value="ไม่หัก">ไม่หัก</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
            <aside className="excel-instruction space-y-3">
              <h4 className="text-sm font-semibold">หมายเหตุ</h4>
              <p>แก้ไขข้อมูลผู้รับจ้างได้ที่แท็บข้อมูลผู้รับจ้าง</p>
            </aside>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4">
            <h3 className="excel-title text-lg">STEP 6: กำหนดวันเอกสาร</h3>
            {form.caseType === "LUNCH" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="excel-label">
                    เลขที่คำสั่งแต่งตั้งคณะกรรมการ{requiredMark}
                  </label>
                  <input
                    className={`${getInputClass("yellow", showStep6Errors && !lunchDocNumbers.committeeOrderNumber)} mt-1`}
                    value={lunchDocNumbers.committeeOrderNumber}
                    onChange={(event) =>
                      setLunchDocNumbers((prev) => ({ ...prev, committeeOrderNumber: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">
                    เลขที่บันทึกข้อความรายงานผล{requiredMark}
                  </label>
                  <input
                    className={`${getInputClass("yellow", showStep6Errors && !lunchDocNumbers.reportNumber)} mt-1`}
                    value={lunchDocNumbers.reportNumber}
                    onChange={(event) =>
                      setLunchDocNumbers((prev) => ({ ...prev, reportNumber: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">เลขที่ใบเสนอราคา</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={lunchDocNumbers.quoteNumber}
                    onChange={(event) =>
                      setLunchDocNumbers((prev) => ({ ...prev, quoteNumber: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">เลขที่ใบสั่งจ้าง</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={lunchDocNumbers.purchaseOrderNumber}
                    onChange={(event) =>
                      setLunchDocNumbers((prev) => ({ ...prev, purchaseOrderNumber: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">เลขที่ใบส่งมอบงานจ้าง</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={lunchDocNumbers.deliveryNoteNumber}
                    onChange={(event) =>
                      setLunchDocNumbers((prev) => ({ ...prev, deliveryNoteNumber: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">เลขที่บันทึกข้อความขอเบิกเงิน</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={lunchDocNumbers.paymentNoteNumber}
                    onChange={(event) =>
                      setLunchDocNumbers((prev) => ({ ...prev, paymentNoteNumber: event.target.value }))
                    }
                  />
                </div>
              </div>
            ) : null}
            {form.caseType === "LUNCH" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="excel-label">ยืนราคากี่วัน</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={lunchExtra.quoteValidDays}
                    onChange={(event) =>
                      setLunchExtra((prev) => ({ ...prev, quoteValidDays: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">ยืนราคาถึงวันที่</label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className="excel-input excel-input-green"
                      value={lunchExtra.quoteValidUntilDate.day}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          quoteValidUntilDate: { ...prev.quoteValidUntilDate, day: event.target.value }
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
                      value={lunchExtra.quoteValidUntilDate.month}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          quoteValidUntilDate: { ...prev.quoteValidUntilDate, month: event.target.value }
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
                      value={lunchExtra.quoteValidUntilDate.year}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          quoteValidUntilDate: { ...prev.quoteValidUntilDate, year: event.target.value }
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
                <div>
                  <label className="excel-label">ยื่นราคาถึงวันที่</label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className="excel-input excel-input-green"
                      value={lunchExtra.bidSubmitEndDate.day}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          bidSubmitEndDate: { ...prev.bidSubmitEndDate, day: event.target.value }
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
                      value={lunchExtra.bidSubmitEndDate.month}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          bidSubmitEndDate: { ...prev.bidSubmitEndDate, month: event.target.value }
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
                      value={lunchExtra.bidSubmitEndDate.year}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          bidSubmitEndDate: { ...prev.bidSubmitEndDate, year: event.target.value }
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
                <div>
                  <label className="excel-label">ประกาศผู้ชนะเสนอราคา</label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className="excel-input excel-input-green"
                      value={lunchExtra.winnerAnnounceDate.day}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          winnerAnnounceDate: { ...prev.winnerAnnounceDate, day: event.target.value }
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
                      value={lunchExtra.winnerAnnounceDate.month}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          winnerAnnounceDate: { ...prev.winnerAnnounceDate, month: event.target.value }
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
                      value={lunchExtra.winnerAnnounceDate.year}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          winnerAnnounceDate: { ...prev.winnerAnnounceDate, year: event.target.value }
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
                <div>
                  <label className="excel-label">เลขที่อนุมัติจ้าง</label>
                  <input
                    className="excel-input excel-input-yellow mt-1"
                    value={lunchExtra.approvalNumber}
                    onChange={(event) =>
                      setLunchExtra((prev) => ({ ...prev, approvalNumber: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="excel-label">วันที่อนุมัติจ้าง</label>
                  <div className="mt-1 grid gap-2 md:grid-cols-3">
                    <select
                      className="excel-input excel-input-green"
                      value={lunchExtra.approvalDate.day}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          approvalDate: { ...prev.approvalDate, day: event.target.value }
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
                      value={lunchExtra.approvalDate.month}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          approvalDate: { ...prev.approvalDate, month: event.target.value }
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
                      value={lunchExtra.approvalDate.year}
                      onChange={(event) =>
                        setLunchExtra((prev) => ({
                          ...prev,
                          approvalDate: { ...prev.approvalDate, year: event.target.value }
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
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              {(form.caseType === "LUNCH"
                ? [
                    ["วันที่ออกคำสั่งแต่งตั้งคณะกรรมการ", "committeeOrder"],
                    ["วันที่บันทึกข้อความรายงานผล", "report"],
                    ["วันที่ใบเสนอราคา", "quote"],
                    ["วันที่ใบสั่งจ้าง", "order"],
                    ["วันที่ส่งมอบงาน", "delivery"],
                    ["วันที่ตรวจรับพัสดุ", "inspection"],
                    ["วันที่ขอเบิกเงิน", "payment"]
                  ]
                : [
                    ["วันที่ใบเสนอราคา", "quote"],
                    ["วันที่ใบสั่งจ้าง", "order"],
                    ["วันที่ส่งมอบงาน", "delivery"],
                    ["วันที่ตรวจรับพัสดุ", "inspection"],
                    ["วันที่ขอเบิกเงิน", "payment"]
                  ]
              ).map(([label, key]) => {
                const dateKey =
                  key === "committeeOrder"
                    ? "committeeOrderDate"
                    : key === "report"
                      ? "reportDate"
                      : key;
                const value =
                  dateKey === "committeeOrderDate"
                    ? lunchDocNumbers.committeeOrderDate
                    : dateKey === "reportDate"
                      ? lunchDocNumbers.reportDate
                      : documentDates[dateKey as keyof typeof documentDates];
                const isMissing = showStep6Errors && !isDateComplete(value);
                const updateDate =
                  dateKey === "committeeOrderDate"
                    ? (next: DateParts) =>
                        setLunchDocNumbers((prev) => ({ ...prev, committeeOrderDate: next }))
                    : dateKey === "reportDate"
                      ? (next: DateParts) =>
                          setLunchDocNumbers((prev) => ({ ...prev, reportDate: next }))
                      : (next: DateParts) =>
                          setDocumentDates((prev) => ({
                            ...prev,
                            [dateKey as keyof typeof documentDates]: next
                          }));
                return (
                  <div key={label}>
                    <label className="excel-label">
                      {label}
                      {requiredMark}
                    </label>
                    <div className="mt-1 grid gap-2 md:grid-cols-3">
                      <select
                        className={getInputClass("green", isMissing)}
                        value={value.day}
                        onChange={(event) => updateDate({ ...value, day: event.target.value })}
                      >
                        <option value="">วัน</option>
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <select
                        className={getInputClass("green", isMissing)}
                        value={value.month}
                        onChange={(event) => updateDate({ ...value, month: event.target.value })}
                      >
                        <option value="">เดือน</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        className={getInputClass("green", isMissing)}
                        value={value.year}
                        onChange={(event) => updateDate({ ...value, year: event.target.value })}
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
