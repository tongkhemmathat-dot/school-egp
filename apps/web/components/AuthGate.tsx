"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRedirectPath, getToken, setRedirectPath } from "../lib/api";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (pathname === "/login") {
      if (token) {
        const target = getRedirectPath() || "/dashboard";
        router.replace(target);
      }
      return;
    }
    if (!token) {
      setRedirectPath(pathname);
      router.replace("/login");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
