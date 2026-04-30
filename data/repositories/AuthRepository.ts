/**
 * DATA LAYER — AuthRepository
 *
 * Endpoint map:
 *   POST /auth/login/               ← { identifier }             — checks user / creates & emails pass
 *   POST /auth/login/               ← { identifier, password }   — returns tokens
 *   POST /auth/logout/              ← { refresh }
 *   POST /auth/token/refresh/       ← { refresh }
 *   POST /auth/password/reset/      ← { email }
 *   GET  /auth/profile/             ← Bearer token required
 */

import type {
  AuthSession,
  AuthUser,
  TokenPair,
} from "../../domain/entities/AuthUser";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import * as SecureStore from "../../utils/storage";
import { api, extractApiError, TOKEN_KEYS } from "../sources/axiosInstance";

interface BackendUser {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  role: string;
  is_email_verified?: boolean;
  avatar: string | null;
}

interface VerifyEmailResponse {
  message: string;
  user: BackendUser;
  tokens: { access: string; refresh: string };
}

interface TokenRefreshResponse {
  access: string;
}

function mapUser(u: BackendUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone ?? undefined,
    first_name: u.first_name,
    last_name: u.last_name,
    name: `${u.first_name} ${u.last_name}`.trim(),
    role: u.role,
    is_email_verified: u.is_email_verified ?? true,
    avatar: u.avatar,
  };
}

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export class AuthRepository implements IAuthRepository {
  // Step 1 — Check if user exists. If not, auto-registers and sends password to email.
  async checkEmail(email: string): Promise<boolean> {
    try {
      const response = await api.post("/auth/login/", { identifier: email, password: "" });
      if (response.status === 201) return true; // new user, password sent
      return true;
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.error === "Password is required for existing accounts.") {
        return false; // existing user, needs password
      }
      throw new Error(extractApiError(err));
    }
  }

  // Step 2 — Login with credentials.
  async loginWithEmail(email: string, password: string): Promise<AuthSession> {
    try {
      const { data } = await api.post("/auth/login/", { identifier: email, password });
      await this._persistTokens(data.tokens);
      return { user: mapUser(data.user), tokens: data.tokens };
    } catch (err) {
      throw new Error(extractApiError(err));
    }
  }

  async requestPhoneOtp(phone: string): Promise<void> {
    throw new Error("Phone login is not yet supported by the backend.");
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<AuthSession> {
    throw new Error(
      "Phone OTP verification is not yet supported by the backend.",
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api.post("/auth/password/reset/", { email });
    } catch (err) {
      throw new Error(extractApiError(err));
    }
  }

  async refreshAccessToken(): Promise<string> {
    const refresh = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
    if (!refresh) throw new Error("No refresh token stored.");
    try {
      const { data } = await api.post<TokenRefreshResponse>(
        "/auth/token/refresh/",
        { refresh },
      );
      await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, data.access);
      return data.access;
    } catch (err) {
      throw new Error(extractApiError(err));
    }
  }

  async getStoredUser(): Promise<AuthUser | null> {
    const access = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
    if (!access) {
      const refresh = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
      if (!refresh) return null;
      try {
        await this.refreshAccessToken();
        return this._fetchProfile();
      } catch {
        return null;
      }
    }
    if (isTokenExpired(access)) {
      try {
        await this.refreshAccessToken();
        return this._fetchProfile();
      } catch {
        return null;
      }
    }
    return this._fetchProfile();
  }

  async signOut(): Promise<void> {
    const refresh = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
    try {
      await api.post("/auth/logout/", { refresh });
    } catch {}
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
  }

  private async _persistTokens(tokens: TokenPair): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, tokens.access);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, tokens.refresh);
  }

  private async _fetchProfile(): Promise<AuthUser | null> {
    try {
      const { data } = await api.get<BackendUser>("/auth/profile/");
      return mapUser(data);
    } catch {
      return null;
    }
  }
}

export const authRepository = new AuthRepository();
