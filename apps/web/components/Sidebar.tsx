"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, clearRedirectPath, getUser } from "../lib/api";
import type { ApiUser } from "../lib/types";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Cases", href: "/cases" },
  { label: "Reports", href: "/reports/procurement-register" },
  { label: "Admin", href: "/admin" }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const items = navItems.map((item) => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`)
  }));

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    clearAuth();
    clearRedirectPath();
    router.replace("/login");
  };

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold">ระบบพัสดุโรงเรียน</h1>
        <p className="text-sm text-slate-500">Procurement MVP</p>
      </div>
      <nav className="space-y-1 px-4">
        {items.map((item) => (
          <Link
            key={item.href}
            className={`block rounded px-3 py-2 ${
              item.active ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100"
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t px-4 py-4 text-sm text-slate-600">
        {user ? (
          <>
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{user.role}</div>
          </>
        ) : (
          <div className="text-slate-400">Not signed in</div>
        )}
        <button
          className="mt-3 w-full rounded border px-3 py-2 text-sm hover:bg-slate-50"
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
