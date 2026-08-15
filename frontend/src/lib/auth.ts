"use client";

// Authentication & Token Management Utility

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "school-admin" | "unit" | "delivery" | string;
  isAdmin?: boolean;
  isSchool?: boolean;
  isUnit?: boolean;
  isDelivery?: boolean;
  name?: string;
  unitName?: string;
  schoolName?: string;
  vehicleNo?: string;
  phone?: string;
}

export function setAuthSession(token: string, role: string, user?: AuthUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    }
    localStorage.setItem("user_role", role);

    // Set cookies for Next.js middleware (7 days expiry)
    const expires = new Date(Date.now() + 7 * 86400 * 1000).toUTCString();
    document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `role=${encodeURIComponent(role)}; path=/; expires=${expires}; SameSite=Lax`;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("auth_token");
  if (token) return token;

  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthRole(): string | null {
  if (typeof window === "undefined") return null;

  const role = localStorage.getItem("user_role");
  if (role) return role;

  const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("auth_user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    // 1. Clear LocalStorage
    localStorage.clear();

    // 2. Clear SessionStorage
    sessionStorage.clear();

    // 3. Aggressively expire all cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name.trim()}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${name.trim()}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
  }
}

// Authenticated Fetch Helper
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return res;
}