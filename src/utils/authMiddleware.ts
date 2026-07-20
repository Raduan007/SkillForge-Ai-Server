import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwtUtils.js";
import { sendFail } from "./apiResponse.js";
import * as authService from "../services/authService.js";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Reusable Express middleware to enforce valid JWT authentication.
 *
 * 1. Checks for Bearer token in the Authorization header.
 * 2. Verifies the signature and expiration using verifyAccessToken.
 * 3. Pulls user from database via getUserById and binds it to req.user.
 * 4. Fails with 401/403 standard JSON responses on authentication failures.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendFail(
      res,
      401,
      "Authentication required. Provide a Bearer token in the Authorization header."
    );
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    sendFail(res, 401, "Authentication token is missing.");
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded.sub) {
      sendFail(res, 401, "Invalid authentication token payload.");
      return;
    }

    const user = await authService.getUserById(decoded.sub);
    if (!user) {
      sendFail(res, 401, "User session not found.");
      return;
    }

    if (!user.isActive) {
      sendFail(res, 403, "Your account has been deactivated. Please contact support.");
      return;
    }

    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TokenExpiredError") {
      sendFail(res, 401, "Authentication token has expired.");
      return;
    }
    sendFail(res, 401, "Invalid authentication token.");
  }
}
