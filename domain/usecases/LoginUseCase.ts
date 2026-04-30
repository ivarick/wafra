/**
 * DOMAIN LAYER — Use Cases
 *
 * Each class encapsulates one business operation.
 * They receive a repository (injected) and contain ALL validation and
 * orchestration logic — Presentation components stay dumb.
 */

import type { AuthSession, AuthUser } from "../entities/AuthUser";
import type { IAuthRepository } from "../repositories/IAuthRepository";

/* ─────────────────────────────────── CheckEmailUseCase ──── */

export class CheckEmailUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(email: string): Promise<boolean> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) throw new Error("Email is required.");
    if (!this._isValidEmail(trimmedEmail))
      throw new Error("Invalid email address.");

    return this.repo.checkEmail(trimmedEmail);
  }

  private _isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

/* ─────────────────────────────────── LoginWithEmailUseCase ──── */

export class LoginWithEmailUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(email: string, password: string): Promise<AuthSession> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) throw new Error("Email is required.");
    if (!this._isValidEmail(trimmedEmail))
      throw new Error("Invalid email address.");
    if (!password.trim()) throw new Error("Password is required.");

    return this.repo.loginWithEmail(trimmedEmail, password);
  }

  private _isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

/* ─────────────────────────────── RequestPhoneOtpUseCase ──────── */

export class RequestPhoneOtpUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(phone: string): Promise<void> {
    const stripped = phone.replace(/\s/g, "");
    if (stripped.length < 9)
      throw new Error("Please enter a valid phone number.");
    return this.repo.requestPhoneOtp(stripped);
  }
}

/* ─────────────────────────────── VerifyPhoneOtpUseCase ──────── */

export class VerifyPhoneOtpUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(phone: string, code: string): Promise<AuthSession> {
    if (code.length !== 6) throw new Error("Please enter all 6 digits.");
    return this.repo.verifyPhoneOtp(phone, code);
  }
}

/* ──────────────────────────── RequestPasswordResetUseCase ────── */

export class RequestPasswordResetUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(email: string): Promise<void> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) throw new Error("Email is required.");
    return this.repo.requestPasswordReset(trimmed);
  }
}



/* ──────────────────────────────── GetStoredUserUseCase ─────── */

export class GetStoredUserUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(): Promise<AuthUser | null> {
    return this.repo.getStoredUser();
  }
}

/* ──────────────────────────────────── SignOutUseCase ─────────── */

export class SignOutUseCase {
  constructor(private readonly repo: IAuthRepository) {}

  async execute(): Promise<void> {
    return this.repo.signOut();
  }
}
