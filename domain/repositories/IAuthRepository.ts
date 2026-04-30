/**
 * DOMAIN LAYER — Repository Interface: IAuthRepository
 *
 * Defines the contract the Data layer MUST fulfill.
 * The Presentation layer depends on this abstraction — never on Axios or
 * SecureStore directly. Swapping the backend (or adding a mock) requires
 * changing only the Data layer implementation.
 */

import type { AuthSession, AuthUser } from "../entities/AuthUser";

export interface IAuthRepository {
  [x: string]: any;
  /**
   * Check if email exists. If not, auto-registers and sends a password via email.
   * ➜ POST /api/auth/login/  { identifier }
   * ← 201 Created (if new) or 400 (if existing)
   * Returns true if a password was sent, false if password is required.
   */
  checkEmail(email: string): Promise<boolean>;

  /**
   * Authenticate via email + password.
   * ➜ POST /api/auth/login/  { identifier, password }
   * ← { access, refresh, user }
   */
  loginWithEmail(email: string, password: string): Promise<AuthSession>;

  /**
   * Request an OTP for the given phone number.
   * ➜ POST /api/auth/phone/request/  { phone }
   * ← 204 No Content (or { detail })
   *
   * Stub: Backend endpoint not yet implemented. Shape is defined here so the
   * Data layer can be filled in without touching Domain or Presentation.
   */
  requestPhoneOtp(phone: string): Promise<void>;

  /**
   * Verify the OTP and exchange it for a full session.
   * ➜ POST /api/auth/phone/verify/  { phone, code }
   * ← { access, refresh, user }
   *
   * Stub: implementation pending backend endpoint.
   */
  verifyPhoneOtp(phone: string, code: string): Promise<AuthSession>;

  /**
   * Trigger a password-reset email.
   * ➜ POST /api/auth/password/reset/  { email }
   * ← 204 No Content
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Silently refresh the access token using the stored refresh token.
   * ➜ POST /api/auth/token/refresh/  { refresh }
   * ← { access }
   */
  refreshAccessToken(): Promise<string>;

  /**
   * Decode the access token in SecureStore and return the user,
   * or null if no valid token exists.
   */
  getStoredUser(): Promise<AuthUser | null>;

  /**
   * Clear both tokens from SecureStore and log out.
   */
  signOut(): Promise<void>;
}
