"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRedirectPath, setRedirectPath } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (pathname === "/login") {
      if (user) {
        const target = getRedirectPath() || "/dashboard";
        router.replace(target);
      }
      return;
    }
    if (!loading && !user) {
      if (pathname !== "/login") {
        setRedirectPath(pathname);
      }
      router.replace("/login");
      return;
    }
    if (!loading && user && pathname.startsWith("/admin") && user.role !== "Admin") {
      router.replace("/dashboard");
    }
  }, [pathname, router, user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
