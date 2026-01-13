import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "ระบบพัสดุโรงเรียน",
  description: "ระบบพัสดุโรงเรียน - Procurement MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-white shadow-lg">
            <div className="p-6">
              <h1 className="text-xl font-bold">ระบบพัสดุโรงเรียน</h1>
              <p className="text-sm text-slate-500">Procurement MVP</p>
            </div>
            <nav className="space-y-1 px-4">
              <a className="block rounded px-3 py-2 hover:bg-slate-100" href="/dashboard">
                Dashboard
              </a>
              <a className="block rounded px-3 py-2 hover:bg-slate-100" href="/cases">
                Cases
              </a>
              <a className="block rounded px-3 py-2 hover:bg-slate-100" href="/reports/procurement-register">
                Reports
              </a>
              <a className="block rounded px-3 py-2 hover:bg-slate-100" href="/admin">
                Admin
              </a>
            </nav>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
