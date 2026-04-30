/**
 * DOMAIN LAYER — Entity: AuthUser
 *
 * Pure TypeScript. Zero framework dependencies.
 * This is the canonical user shape that flows through every layer.
 *
 * Matches the backend user object exactly:
 *   id, email, phone, first_name, last_name, role,
 *   is_email_verified, avatar
 *
 * `name` is a convenience field (first_name + last_name) built
 * in the repository layer — never comes from the backend directly.
 */

export interface AuthUser {
  id: string; // UUID
  email: string;
  phone?: string | null;
  first_name?: string;
  last_name?: string;
  name?: string; // derived: `${first_name} ${last_name}`
  role?: string;
  is_email_verified?: boolean;
  avatar?: string | null;
  bio?: string | null;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: TokenPair;
}
