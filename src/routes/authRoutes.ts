import { Router } from "express";
import * as authController from "../controllers/authController.js";

const router = Router();

// ─── Local Auth Routes ───────────────────────────────────────────────────────

router.post("/register", authController.register);
router.post("/login", authController.login);

// ─── Profile Routes ──────────────────────────────────────────────────────────

// This route requires auth middleware, which is not implemented yet.
router.get("/me", authController.me);

export default router;
