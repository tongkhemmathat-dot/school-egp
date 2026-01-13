"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearAuth, getUser, setAuth } from "./api";
import type { ApiUser } from "./types";

type AuthContextValue = {
  user: ApiUser | null;
  loading: boolean;
  login: (user: ApiUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((nextUser: ApiUser) => {
    setAuth(nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    apiFetch("auth/logout", { method: "POST", noAuth: true }).catch(() => undefined);
    clearAuth();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    try {
      const me = await apiFetch<ApiUser>("auth/me", { noAuth: true });
      setAuth(me);
      setUser(me);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
