"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";

export default function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === "/login") {
    return null;
  }

  const title =
    pathname.startsWith("/reports")
      ? "ทะเบียนคุมจัดซื้อ/จัดจ้าง"
      : pathname.startsWith("/cases")
        ? "แฟ้มงานจัดซื้อ/จัดจ้าง"
        : pathname.startsWith("/inventory")
          ? "ทะเบียนวัสดุคงคลัง"
          : pathname.startsWith("/assets")
            ? "ทะเบียนคุมทรัพย์สิน"
            : pathname.startsWith("/admin")
              ? "ศูนย์ผู้ดูแลระบบ"
              : "ภาพรวมงานพัสดุ";

  return (
    <header className="flex items-center justify-between border-b border-[var(--excel-border)] bg-[#fffdf4] px-8 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">school procurement</p>
        <p className="excel-title text-lg">{title}</p>
      </div>
      <div className="text-right text-sm text-slate-600">
        {user ? (
          <>
            <div className="font-semibold text-slate-900">{user.name}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{user.role}</div>
          </>
        ) : (
          <div className="text-slate-400">ยังไม่ได้ลงชื่อเข้าใช้</div>
        )}
      </div>
    </header>
  );
}
