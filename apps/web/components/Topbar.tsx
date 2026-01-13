"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";

export default function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">ระบบพัสดุโรงเรียน</p>
        <p className="text-lg font-semibold">Procurement Dashboard</p>
      </div>
      <div className="text-right text-sm text-slate-600">
        {user ? (
          <>
            <div className="font-semibold text-slate-900">{user.name}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{user.role}</div>
          </>
        ) : (
          <div className="text-slate-400">Not signed in</div>
        )}
      </div>
    </header>
  );
}
