import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../utils/authMiddleware.js";

const router = Router();

// ─── Local Auth Routes ───────────────────────────────────────────────────────

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);

// ─── Profile Routes ──────────────────────────────────────────────────────────

// This route requires auth middleware, which is not implemented yet.
router.get("/me", authController.me);
router.put("/profile", requireAuth, authController.updateProfile);

export default router;
