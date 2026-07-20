import type { Request, Response, NextFunction } from "express";
import { sendFail } from "../utils/apiResponse.js";
import type { AuthenticatedRequest } from "../utils/authMiddleware.js";

/**
 * Express middleware to enforce admin-only access.
 * Must be used AFTER requireAuth middleware (which sets req.user).
 *
 * Rules:
 * - 401 if not authenticated (req.user is missing)
 * - 403 if role !== "admin"
 * - next() if role === "admin"
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Check if authenticated
  if (!req.user) {
    sendFail(res, 401, "Authentication required.");
    return;
  }

  // Check role
  if (req.user.role !== "admin") {
    sendFail(res, 403, "Access denied. Administrator privileges required.");
    return;
  }

  // Role is admin, proceed
  next();
}
