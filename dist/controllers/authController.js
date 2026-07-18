/**
 * Auth Controller
 *
 * Thin controller layer — every handler delegates business logic to AuthService
 * and uses the centralized apiResponse helpers to guarantee a consistent
 * response envelope across all endpoints.
 *
 * Endpoints:
 *   POST /api/auth/register  — create a new local account
 *   POST /api/auth/login     — authenticate and receive a JWT
 *   GET  /api/auth/me        — return the authenticated user's profile
 *
 * Note: Google OAuth and role middleware are deferred to a later phase.
 */
import * as authService from "../services/authService.js";
import { registerSchema, loginSchema, googleLoginSchema } from "../validations/authValidation.js";
import { verifyAccessToken } from "../utils/jwtUtils.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";
// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 *
 * 1. Validate request body (Zod).
 * 2. Delegate to authService.registerUser().
 * 3. Return 201 + { user, accessToken } on success.
 *
 * Error map:
 *   400 — validation failure
 *   409 — duplicate email
 *   500 — unexpected server error
 */
export const register = async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            sendFail(res, 400, "Validation failed", parsed.error.issues);
            return;
        }
        const result = await authService.registerUser(parsed.data);
        if (!result.success) {
            sendFail(res, result.statusCode, result.error);
            return;
        }
        sendOk(res, 201, {
            message: "Account created successfully.",
            accessToken: result.data.accessToken,
            user: result.data.user,
        });
    }
    catch (err) {
        console.error("[AuthController] register:", err);
        sendFail(res, 500, "An unexpected error occurred during registration.");
    }
};
// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 *
 * 1. Validate request body (Zod).
 * 2. Delegate to authService.loginUser() — bcrypt compare + lastLogin update.
 * 3. Return 200 + { user, accessToken } on success.
 *
 * Error map:
 *   400 — validation failure
 *   401 — invalid email or password
 *   403 — account deactivated
 *   500 — unexpected server error
 */
export const login = async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            sendFail(res, 400, "Validation failed", parsed.error.issues);
            return;
        }
        const result = await authService.loginUser(parsed.data);
        if (!result.success) {
            sendFail(res, result.statusCode, result.error);
            return;
        }
        sendOk(res, 200, {
            message: "Login successful.",
            accessToken: result.data.accessToken,
            user: result.data.user,
        });
    }
    catch (err) {
        console.error("[AuthController] login:", err);
        sendFail(res, 500, "An unexpected error occurred during login.");
    }
};
// ─── Current User ─────────────────────────────────────────────────────────────
/**
 * GET /api/auth/me
 *
 * Protected endpoint — no middleware yet, so the token is read and verified
 * inline here. Once auth middleware is introduced, this controller shrinks to
 * a simple `req.user` read.
 *
 * 1. Extract Bearer token from Authorization header.
 * 2. Verify JWT signature and expiry.
 * 3. Load user by `sub` claim via authService.getUserById().
 * 4. Return 200 + SafeUser (password hash is NEVER included).
 *
 * Error map:
 *   401 — missing / invalid / expired token
 *   403 — account deactivated
 *   404 — user not found (token valid but user deleted)
 *   500 — unexpected server error
 */
export const me = async (req, res) => {
    try {
        // ── 1. Extract token ──────────────────────────────────────────────────────
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            sendFail(res, 401, "Authentication required. Provide a Bearer token in the Authorization header.");
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            sendFail(res, 401, "Authentication token is missing.");
            return;
        }
        // ── 2. Verify token ───────────────────────────────────────────────────────
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        }
        catch (err) {
            const name = err instanceof Error ? err.name : "";
            if (name === "TokenExpiredError") {
                sendFail(res, 401, "Authentication token has expired.");
                return;
            }
            sendFail(res, 401, "Invalid authentication token.");
            return;
        }
        if (!decoded.sub) {
            sendFail(res, 401, "Invalid authentication token payload.");
            return;
        }
        // ── 3. Load user ──────────────────────────────────────────────────────────
        const user = await authService.getUserById(decoded.sub);
        if (!user) {
            sendFail(res, 404, "User not found.");
            return;
        }
        if (!user.isActive) {
            sendFail(res, 403, "Your account has been deactivated. Please contact support.");
            return;
        }
        // ── 4. Return safe user (no password hash) ─────────────────────────────
        const safeUser = {
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
        sendOk(res, 200, { user: safeUser });
    }
    catch (err) {
        console.error("[AuthController] me:", err);
        sendFail(res, 500, "An unexpected error occurred while fetching your profile.");
    }
};
/**
 * Google Sign-In and Registration.
 * POST /api/auth/google
 *
 * 1. Validate request body (Zod).
 * 2. Verify Google Token and fetch profile details.
 * 3. Login existing user or register new user.
 * 4. Return JWT + SafeUser.
 */
export const googleLogin = async (req, res) => {
    try {
        const parsed = googleLoginSchema.safeParse(req.body);
        if (!parsed.success) {
            sendFail(res, 400, "Validation failed", parsed.error.issues);
            return;
        }
        const result = await authService.loginOrRegisterGoogle(parsed.data.idToken);
        if (!result.success) {
            sendFail(res, result.statusCode, result.error);
            return;
        }
        // Return flattened standardized response shape
        sendOk(res, 200, {
            message: "Google login successful.",
            accessToken: result.data.accessToken,
            user: result.data.user,
        });
    }
    catch (err) {
        console.error("[AuthController] googleLogin error:", err);
        sendFail(res, 500, "An unexpected error occurred during Google login.");
    }
};
