import { Router } from "express";
import { AchievementController } from "../controllers/achievementController.js";
import { requireAuth } from "../utils/authMiddleware.js";

const router = Router();

router.get("/achievements", requireAuth, AchievementController.getAchievements);
router.get("/streak", requireAuth, AchievementController.getStreak);

export default router;
