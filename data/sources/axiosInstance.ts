/**
 * DATA LAYER — HTTP Client
 *
 * Single Axios instance for all DRF requests.
 * – Automatically injects the Bearer access token on every request.
 * – On 401, attempts a silent token refresh and retries once.
 * – Centralises the base URL so changing the backend host is a one-liner.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in your .env to override the default:
 *   EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080   ← real device
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:8080      ← iOS simulator
 *   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080       ← Android emulator
 */

import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "../../utils/storage";

// ── Base URL ──────────────────────────────────────────────────────
// Priority: .env variable → platform default (port 8080)
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://172.20.10.2:8000");

export const TOKEN_KEYS = {
  ACCESS: "nabta_access_token",
  REFRESH: "nabta_refresh_token",
} as const;

// ── Axios instance ────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request interceptor: attach Bearer token ─────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent 401 refresh ─────────────────────
let _isRefreshing = false;
let _failedQueue: {
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}[] = [];

function _processQueue(error: unknown, token: string | null) {
  _failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  _failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only intercept 401s that haven't been retried yet,
    // and never on the refresh endpoint itself.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/token/refresh/") &&
      !originalRequest.url?.includes("/auth/login/")
    ) {
      // If a refresh is already in flight, queue this request.
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const refresh = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
        if (!refresh) throw new Error("No refresh token stored.");

        const { data } = await axios.post<{ access: string }>(
          `${BASE_URL}/auth/token/refresh/`,
          { refresh },
        );

        await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, data.access);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        _processQueue(null, data.access);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${data.access}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        _processQueue(refreshError, null);
        // Tokens are invalid — wipe them so the app redirects to login.
        await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
        await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * extractApiError
 *
 * Converts an Axios error into a single human-readable string.
 * Handles all common DRF error shapes:
 *   { detail: "..." }
 *   { message: "..." }
 *   { email: ["..."], password: ["..."] }
 *   { non_field_errors: ["..."] }
 */
export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;

    if (Array.isArray(data?.non_field_errors)) {
      return data.non_field_errors[0];
    }

    if (typeof data === "object" && data !== null) {
      const firstKey = Object.keys(data)[0];
      const firstVal = data[firstKey];
      if (Array.isArray(firstVal) && firstVal.length > 0) {
        return `${firstKey}: ${firstVal[0]}`;
      }
    }

    if (err.response?.status === 400)
      return "Invalid request. Please check your input.";
    if (err.response?.status === 401)
      return "Invalid credentials. Please try again.";
    if (err.response?.status === 403)
      return "You do not have permission to do that.";
    if (err.response?.status === 404) return "Resource not found.";
    if (err.response?.status === 429)
      return "Too many attempts. Please wait a moment.";
    if (err.response?.status && err.response.status >= 500)
      return "Server error. Please try again later.";
    if (!err.response) return "Cannot reach the server. Check your connection.";
  }

  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}
