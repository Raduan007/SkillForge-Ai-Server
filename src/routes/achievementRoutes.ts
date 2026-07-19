import { Router } from "express";
import { AchievementController } from "../controllers/achievementController.js";
import { requireAuth } from "../utils/authMiddleware.js";

const router = Router();

// Protect endpoints with JWT check
router.use(requireAuth);

router.get("/achievements", AchievementController.getAchievements);
router.get("/streak", AchievementController.getStreak);

export default router;
