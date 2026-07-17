import * as authService from "../services/authService.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";
/**
 * Register a new user.
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        // 1. Validate request body against schema
        const parsedData = registerSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsedData.error.issues,
            });
            return;
        }
        // 2. Call service layer
        const result = await authService.registerUser(parsedData.data);
        // 3. Handle service result
        if (!result.success) {
            res.status(result.statusCode).json({
                success: false,
                error: result.error,
            });
            return;
        }
        // 4. Send success response
        res.status(201).json({
            success: true,
            data: result.data,
        });
    }
    catch (error) {
        console.error("[AuthController] register error:", error);
        res.status(500).json({
            success: false,
            error: "An unexpected error occurred during registration.",
        });
    }
};
/**
 * Login user.
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        // 1. Validate request body against schema
        const parsedData = loginSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: parsedData.error.issues,
            });
            return;
        }
        // 2. Call service layer
        const result = await authService.loginUser(parsedData.data);
        // 3. Handle service result
        if (!result.success) {
            res.status(result.statusCode).json({
                success: false,
                error: result.error,
            });
            return;
        }
        // 4. Send success response
        res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (error) {
        console.error("[AuthController] login error:", error);
        res.status(500).json({
            success: false,
            error: "An unexpected error occurred during login.",
        });
    }
};
/**
 * Get current user profile.
 * GET /api/auth/me
 *
 * NOTE: Currently a mock implementation as auth middleware is not yet implemented.
 * This will be updated to use req.user populated by the auth middleware.
 */
export const me = async (req, res) => {
    // TODO: Implement actual logic once auth middleware is ready
    // It should look something like:
    // if (!req.user) { return res.status(401).json(...) }
    // const user = await authService.getUserById(req.user.sub);
    res.status(501).json({
        success: false,
        error: "Not implemented: Requires auth middleware.",
    });
};
