/**
 * Reusable API response types.
 *
 * All service functions return one of these shapes so controllers
 * and future middleware have a consistent, type-safe contract to
 * work with.
 */

// ─── Generic Result ──────────────────────────────────────────────────────────

/**
 * A discriminated union that wraps either a success value or a structured error.
 * Services return this instead of throwing, keeping error handling predictable.
 *
 * @example
 * const result = await registerUser(data);
 * if (!result.success) {
 *   res.status(result.statusCode).json({ error: result.error });
 *   return;
 * }
 * res.json(result.data);
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };

// ─── User-Specific Safe Types ────────────────────────────────────────────────

/**
 * A user object safe to include in any API response.
 * The `password` field is intentionally omitted.
 */
export interface SafeUser {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: "local" | "google";
  role: "user" | "admin";
  isVerified: boolean;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth Response Types ─────────────────────────────────────────────────────

/** Returned after a successful registration. */
export interface RegisterResult {
  user: SafeUser;
  accessToken: string;
}

/** Returned after a successful login. */
export interface LoginResult {
  user: SafeUser;
  accessToken: string;
}
