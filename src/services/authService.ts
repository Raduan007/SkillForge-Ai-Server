/**
 * Auth Service
 *
 * Handles all user authentication business logic:
 *   - registerUser()   — create account, hash password, issue token
 *   - loginUser()      — verify credentials, update lastLogin, issue token
 *   - getUserByEmail() — internal lookup used by future middleware/OAuth
 *   - getUserById()    — internal lookup by Mongoose ObjectId
 *
 * Rules enforced here:
 *   - Passwords are ALWAYS hashed with bcrypt before storage.
 *   - Password hashes are NEVER returned to callers.
 *   - All functions return ServiceResult<T> — never throw to the caller.
 */

import bcrypt from "bcrypt";
import User from "../models/User.js";
import type { IUser } from "../models/User.js";
import { generateAccessToken } from "../utils/jwtUtils.js";
import type {
  ServiceResult,
  SafeUser,
  RegisterResult,
  LoginResult,
} from "../types/authTypes.js";
import type { RegisterInput, LoginInput } from "../validations/authValidation.js";

// ─── Constants ───────────────────────────────────────────────────────────────

/** bcrypt work factor — high enough to be secure, low enough to be fast. */
const SALT_ROUNDS = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strips the password hash and converts the Mongoose document to a plain
 * SafeUser object suitable for inclusion in any API response.
 */
function toSafeUser(user: IUser): SafeUser {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    provider: user.provider,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    lastLogin: user.lastLogin ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Register a new local user.
 *
 * Steps:
 *  1. Check for duplicate email.
 *  2. Hash the plain-text password with bcrypt.
 *  3. Persist the new user.
 *  4. Issue an access token.
 *  5. Return safe user + token (no password hash).
 *
 * @param input - Validated register payload (name, email, password).
 * @returns ServiceResult with user + token on success, or an error descriptor.
 */
export async function registerUser(
  input: RegisterInput
): Promise<ServiceResult<RegisterResult>> {
  try {
    // 1. Duplicate check
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      return {
        success: false,
        error: "An account with this email already exists.",
        statusCode: 409,
      };
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 3. Persist
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      provider: "local",
    });

    // 4. Issue token
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      provider: "local",
    });

    // 5. Return — never expose the hash
    return {
      success: true,
      data: {
        user: toSafeUser(user),
        accessToken,
      },
    };
  } catch (err) {
    console.error("[AuthService] registerUser error:", err);
    return {
      success: false,
      error: "Registration failed. Please try again later.",
      statusCode: 500,
    };
  }
}

/**
 * Authenticate a local user with email + password.
 *
 * Steps:
 *  1. Find user by email — explicitly select the password field (it's hidden by default).
 *  2. Verify the user is active.
 *  3. Compare the supplied password against the bcrypt hash.
 *  4. Update lastLogin timestamp.
 *  5. Issue an access token.
 *  6. Return safe user + token (no password hash).
 *
 * Deliberately vague error messages for email/password failures to prevent
 * user-enumeration attacks.
 *
 * @param input - Validated login payload (email, password).
 * @returns ServiceResult with user + token on success, or an error descriptor.
 */
export async function loginUser(
  input: LoginInput
): Promise<ServiceResult<LoginResult>> {
  try {
    // 1. Find user — must explicitly select password because field has `select: false`
    const user = await User.findOne({ email: input.email }).select("+password");

    // Vague message intentional — prevents user enumeration
    if (!user) {
      return {
        success: false,
        error: "Invalid email or password.",
        statusCode: 401,
      };
    }

    // 2. Account active check
    if (!user.isActive) {
      return {
        success: false,
        error: "Your account has been deactivated. Please contact support.",
        statusCode: 403,
      };
    }

    // 3. Password comparison
    if (!user.password) {
      // OAuth-only account — no local password set
      return {
        success: false,
        error: "This account uses a different login method.",
        statusCode: 401,
      };
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      return {
        success: false,
        error: "Invalid email or password.",
        statusCode: 401,
      };
    }

    // 4. Update lastLogin (non-blocking — don't fail login if this errors)
    user.lastLogin = new Date();
    await user.save().catch((err: unknown) =>
      console.warn("[AuthService] Failed to update lastLogin:", err)
    );

    // 5. Issue token
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      provider: user.provider,
    });

    // 6. Return — never expose the hash
    return {
      success: true,
      data: {
        user: toSafeUser(user),
        accessToken,
      },
    };
  } catch (err) {
    console.error("[AuthService] loginUser error:", err);
    return {
      success: false,
      error: "Login failed. Please try again later.",
      statusCode: 500,
    };
  }
}

/**
 * Look up a user by email address.
 *
 * Used internally by future auth middleware and OAuth handlers.
 * Password hash is NOT selected — use `.select("+password")` at call-site
 * if you need to compare credentials.
 *
 * @param email - Email to search for (case-insensitive via schema lowercase).
 * @returns The Mongoose document, or null if not found.
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase().trim() });
}

/**
 * Look up a user by their MongoDB ObjectId.
 *
 * Used internally by auth middleware to hydrate `req.user` from a token's
 * `sub` claim.
 *
 * @param id - MongoDB ObjectId string.
 * @returns The Mongoose document, or null if not found.
 */
export async function getUserById(id: string): Promise<IUser | null> {
  return User.findById(id);
}
