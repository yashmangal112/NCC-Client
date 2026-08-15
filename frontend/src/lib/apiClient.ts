// lib/apiClient.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single fetch wrapper used by every service.
// Reads NEXT_PUBLIC_API_BASE_URL from .env.local
// Automatically attaches auth token from localStorage if present.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001") + "/api";


// Shape every API response follows  { success, data } or { success, error }
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tv_token");
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers = {}, ...rest } = options;

  // Build query string
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  // Build headers
  const token = getToken();
  const reqHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...rest,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  // Parse JSON safely
  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("Server returned invalid JSON", res.status);
  }

  if (!res.ok || !json.success) {
    throw new ApiError(json.error ?? "Request failed", res.status);
  }

  return json.data;
}

// Convenience methods
export const apiClient = {
  get:    <T>(path: string, params?: RequestOptions["params"]) =>
            request<T>(path, { method: "GET", params }),
  post:   <T>(path: string, body: Record<string, unknown>) =>
            request<T>(path, { method: "POST", body }),
  put:    <T>(path: string, body: Record<string, unknown>) =>
            request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) =>
            request<T>(path, { method: "DELETE" }),
};