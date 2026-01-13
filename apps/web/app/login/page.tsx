"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, clearRedirectPath, getRedirectPath, setRedirectPath } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { ApiUser } from "../../lib/types";

type LoginResponse = {
  accessToken: string;
  user: ApiUser;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirectParam = searchParams.get("redirect");
      if (redirectParam) {
        setRedirectPath(redirectParam);
      }
      const data = await apiFetch<LoginResponse>("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        noAuth: true
      });
      login(data.user);
      const target = redirectParam || getRedirectPath();
      clearRedirectPath();
      router.replace(target && target !== "/login" ? target : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h2 className="text-2xl font-semibold">เข้าสู่ระบบ</h2>
      <p className="mt-2 text-sm text-slate-500">ใช้บัญชีที่ผู้ดูแลระบบสร้างไว้</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium">อีเมล</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            type="email"
          />
        </div>
        <div>
          <label className="text-sm font-medium">รหัสผ่าน</label>
          <input
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
