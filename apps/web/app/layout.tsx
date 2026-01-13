import "./globals.css";
import type { ReactNode } from "react";
import { Sarabun } from "next/font/google";
import AuthGate from "../components/AuthGate";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { AuthProvider } from "../lib/auth";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body"
});

export const metadata = {
  title: "ระบบพัสดุโรงเรียน",
  description: "ระบบพัสดุโรงเรียน - Procurement MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className={`min-h-screen text-slate-900 ${sarabun.variable} excel-grid`}>
        <AuthProvider>
          <AuthGate>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Topbar />
                <main className="flex-1 p-8">{children}</main>
              </div>
            </div>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
