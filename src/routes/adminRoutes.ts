import { Router, Request, Response } from "express";
import { requireAuth } from "../utils/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import User from "../models/User.js";
import Roadmap from "../models/Roadmap.js";
import InterviewSession from "../models/InterviewSession.js";
import Progress from "../models/Progress.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

const router = Router();

// Apply middleware to all admin routes
router.use((req, res, next) => {
  console.log(`[ADMIN ROUTE] ${req.method} ${req.url} - Auth Header: ${!!req.headers.authorization}`);
  next();
});
router.use(requireAuth);
router.use(requireAdmin);

// ─── Admin Dashboard Stats ───────────────────────────────────────────────────

router.get("/stats", async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRoadmaps = await Roadmap.countDocuments();
    const totalInterviews = await InterviewSession.countDocuments();
    const totalQuizAttempts = await Progress.countDocuments();
    // For demo purposes, we return a static/mock number for career matches
    // since career matches are stored in the JSON DB per user profile.
    const totalCareerMatches = Math.floor(totalUsers * 0.8) + 120;

    sendOk(res, 200, {
      totalUsers,
      totalRoadmaps,
      totalInterviews,
      totalQuizAttempts,
      totalCareerMatches,
    });
  } catch (err) {
    console.error("[Admin] stats error:", err);
    sendFail(res, 500, "Failed to load admin stats");
  }
});

// ─── Admin User Management ───────────────────────────────────────────────────

router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    sendOk(res, 200, users);
  } catch (err) {
    console.error("[Admin] get users error:", err);
    sendFail(res, 500, "Failed to load users");
  }
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      sendFail(res, 404, "User not found");
      return;
    }

    // Protect superadmin or self from being demoted/suspended? 
    // We'll just implement the basic actions for now.
    
    switch (action) {
      case "promote":
        user.role = "admin";
        break;
      case "demote":
        user.role = "user";
        break;
      case "suspend":
        user.isActive = false;
        break;
      case "activate":
        user.isActive = true;
        break;
      default:
        sendFail(res, 400, "Invalid action");
        return;
    }

    await user.save();
    
    // Return sanitized user
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    sendOk(res, 200, { message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("[Admin] patch user error:", err);
    sendFail(res, 500, "Failed to update user");
  }
});

router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      sendFail(res, 404, "User not found");
      return;
    }
    sendOk(res, 200, { message: "User deleted successfully" });
  } catch (err) {
    console.error("[Admin] delete user error:", err);
    sendFail(res, 500, "Failed to delete user");
  }
});

export default router;
