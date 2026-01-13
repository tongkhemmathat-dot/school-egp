import "./globals.css";
import type { ReactNode } from "react";
import AuthGate from "../components/AuthGate";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "ระบบพัสดุโรงเรียน",
  description: "ระบบพัสดุโรงเรียน - Procurement MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthGate>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8">{children}</main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
