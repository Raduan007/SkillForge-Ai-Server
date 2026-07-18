import { Request, Response } from "express";
import * as authService from "../services/authService.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";
import { verifyAccessToken } from "../utils/jwtUtils.js";

/**
 * Register a new user.
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
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
export const login = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
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
 * Extracts the JWT token from the Authorization header and verifies it manually.
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Authentication required. Please provide a Bearer token in the Authorization header.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication token missing.",
      });
      return;
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        res.status(401).json({
          success: false,
          error: "Authentication token has expired.",
        });
        return;
      }
      res.status(401).json({
        success: false,
        error: "Invalid authentication token.",
      });
      return;
    }

    if (!decoded.sub) {
      res.status(401).json({
        success: false,
        error: "Invalid authentication token payload.",
      });
      return;
    }

    // Fetch user details
    const user = await authService.getUserById(decoded.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found.",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: "Your account has been deactivated. Please contact support.",
      });
      return;
    }

    // Convert Mongoose document to plain SafeUser
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

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    console.error("[AuthController] me error:", error);
    res.status(500).json({
      success: false,
      error: "An unexpected error occurred while fetching user profile.",
    });
  }
};
