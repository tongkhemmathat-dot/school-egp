import type { ApiUser } from "./types";

const USER_KEY = "school-egp.user";
const REDIRECT_KEY = "school-egp.redirect";

export function getApiBase() {
  if (typeof window !== "undefined") {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    if (envBase && !envBase.includes("localhost")) {
      return envBase;
    }
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:4000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
}

export function getUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function setAuth(user: ApiUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}

export function setRedirectPath(path: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REDIRECT_KEY, path);
}

export function getRedirectPath() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REDIRECT_KEY);
}

export function clearRedirectPath() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REDIRECT_KEY);
}

type ApiFetchOptions = RequestInit & {
  noAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}/${path.replace(/^\/+/, "")}`;
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null && !(options.body instanceof FormData);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && !options.noAuth) {
      clearAuth();
      if (typeof window !== "undefined") {
        if (window.location.pathname !== "/login") {
          setRedirectPath(window.location.pathname);
        }
        window.location.assign("/login");
      }
    }
    const message =
      typeof data === "string" ? data : (data?.message as string) || "Request failed";
    throw new Error(message);
  }

  return data as T;
}
