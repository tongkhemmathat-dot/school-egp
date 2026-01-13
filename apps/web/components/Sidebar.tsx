"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearRedirectPath } from "../lib/api";
import { useAuth } from "../lib/auth";

const navItems = [
  { label: "แดชบอร์ด", href: "/dashboard", roles: ["Admin", "ProcurementOfficer", "Approver", "Viewer"] },
  { label: "งานจัดซื้อ/จัดจ้าง", href: "/cases", roles: ["Admin", "ProcurementOfficer", "Approver", "Viewer"] },
  { label: "คลังวัสดุ", href: "/inventory/requisitions", roles: ["Admin", "ProcurementOfficer"] },
  { label: "ทะเบียนทรัพย์สิน", href: "/assets", roles: ["Admin", "ProcurementOfficer"] },
  { label: "รายงานทะเบียน", href: "/reports/procurement-register", roles: ["Admin", "ProcurementOfficer", "Approver", "Viewer"] },
  { label: "รายละเอียดโรงเรียน", href: "/school-info", roles: ["Admin", "ProcurementOfficer"] },
  { label: "บุคลากร", href: "/staff", roles: ["Admin", "ProcurementOfficer"] },
  { label: "ผู้รับจ้าง", href: "/contractors", roles: ["Admin", "ProcurementOfficer"] },
  { label: "ผู้ดูแลระบบ", href: "/admin", roles: ["Admin"] }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const items = navItems
    .filter((item) => {
      if (!user) return false;
      return item.roles.includes(user.role);
    })
    .map((item) => ({
      ...item,
      active: pathname === item.href || pathname.startsWith(`${item.href}/`)
    }));

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    clearRedirectPath();
    logout();
    router.replace("/login");
  };

  return (
    <aside className="w-72 border-r border-[var(--excel-border)] bg-[#fffdf4]">
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Workbook</p>
        <h1 className="excel-title mt-2 text-xl">ระบบพัสดุโรงเรียน</h1>
        <p className="text-xs text-slate-500">แบบฟอร์มเอกสารราชการ</p>
      </div>
      <nav className="space-y-1 px-4">
        {items.map((item) => (
          <Link
            key={item.href}
            className={`block rounded px-3 py-2 text-sm ${
              item.active
                ? "bg-[var(--excel-green)] font-semibold text-slate-900"
                : "text-slate-700 hover:bg-[rgba(31,122,94,0.12)]"
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t border-[var(--excel-border)] px-4 py-4 text-sm text-slate-700">
        {user ? (
          <>
            <div className="font-semibold">{user.name}</div>
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="excel-chip">{user.role}</span>
            </div>
          </>
        ) : (
          <div className="text-slate-400">ยังไม่ได้ลงชื่อเข้าใช้</div>
        )}
        <button
          className="mt-3 w-full rounded border border-[var(--excel-border)] px-3 py-2 text-sm hover:bg-white"
          onClick={handleLogout}
          type="button"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
