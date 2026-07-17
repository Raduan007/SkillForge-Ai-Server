/**
 * Auth Zod validation schemas.
 *
 * Used to validate request bodies for registration and login
 * before they reach the service layer.
 *
 * Note: Uses Zod v4 API — `error` replaces the v3 `required_error` param.
 */
import { z } from "zod";
// ─── Register ────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim(),
    email: z
        .string()
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters") // bcrypt silently truncates beyond 72
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});
// ─── Login ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z
        .string()
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(1, "Password is required"),
});
