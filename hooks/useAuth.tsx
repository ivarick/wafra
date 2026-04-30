import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authRepository } from "../data/repositories/AuthRepository";
import type { AuthUser } from "../domain/entities/AuthUser";
import {
  CheckEmailUseCase,
  GetStoredUserUseCase,
  LoginWithEmailUseCase,
  RequestPhoneOtpUseCase,
  SignOutUseCase,
  VerifyPhoneOtpUseCase,
} from "../domain/usecases/LoginUseCase";

// ── Use case instances ────────────────────────────────────────────
const loginWithEmailUseCase = new LoginWithEmailUseCase(authRepository);
const checkEmailUseCase = new CheckEmailUseCase(authRepository);
const requestPhoneOtpUseCase = new RequestPhoneOtpUseCase(authRepository);
const verifyPhoneOtpUseCase = new VerifyPhoneOtpUseCase(authRepository);
const getStoredUserUseCase = new GetStoredUserUseCase(authRepository);
const signOutUseCase = new SignOutUseCase(authRepository);

// ── Context type ──────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  /** Step 1 — check email existence, send password if new */
  checkEmail: (email: string) => Promise<boolean>;
  /** Step 2 — logs the user in with password */
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  updateLocalUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const storedUser = await getStoredUserUseCase.execute();
      setUser(storedUser);
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  /**
   * Step 1 — Check if email exists
   */
  async function checkEmail(email: string) {
    setIsSigningIn(true);
    setError(null);
    try {
      return await checkEmailUseCase.execute(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email check failed");
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }

  /**
   * Step 2 — Login with password
   */
  async function signInWithEmail(email: string, pass: string) {
    setIsSigningIn(true);
    setError(null);
    try {
      const session = await loginWithEmailUseCase.execute(email, pass);
      setUser(session.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signInWithGoogle() {
    setIsSigningIn(true);
    setError(null);
    try {
      // TODO: implement real Google OAuth
      setUser({
        id: "test-google-user",
        email: "tester@gmail.com",
        name: "Test User",
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }

  async function requestOtp(phone: string) {
    setIsSigningIn(true);
    setError(null);
    try {
      await requestPhoneOtpUseCase.execute(phone);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request OTP failed");
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }

  async function verifyOtp(phone: string, code: string) {
    setIsSigningIn(true);
    setError(null);
    try {
      const session = await verifyPhoneOtpUseCase.execute(phone, code);
      setUser(session.user);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify OTP failed");
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOutUser() {
    await signOutUseCase.execute();
    setUser(null);
  }

  function updateLocalUser(updates: Partial<AuthUser>) {
    if (user) {
      setUser({ ...user, ...updates });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSigningIn,
        error,
        checkEmail,
        signInWithEmail,
        signInWithGoogle,
        requestOtp,
        verifyOtp,
        signOut: signOutUser,
        clearError,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
