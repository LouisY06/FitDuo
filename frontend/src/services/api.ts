/**
 * Base API utility for making authenticated requests to the backend
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, ""); // Remove trailing slash

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Get the current Firebase ID token for authentication
 */
async function getIdToken(): Promise<string | null> {
  const { auth } = await import("../config/firebase");
  if (!auth?.currentUser) {
    const token = localStorage.getItem("auth_token");
    if (token) return token;
    return null;
  }
  return await auth.currentUser.getIdToken();
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const idToken = await getIdToken();
  
  if (!idToken) {
    throw {
      message: "Not authenticated. Please log in.",
      status: 401,
    } as ApiError;
  }

  // Normalize URL - remove trailing slash from base URL and leading slash from endpoint
  const baseUrl = API_BASE_URL.replace(/\/$/, ""); // Remove trailing slash
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    throw {
      message: "Session expired. Please log in again.",
      status: 401,
    } as ApiError;
  }

  // Handle errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `Request failed with status ${response.status}` 
    }));
    throw {
      message: error.detail || error.message || "Request failed",
      status: response.status,
    } as ApiError;
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  return await response.json();
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}

