import { Router } from "express";
import { ProgressController } from "../controllers/progressController.js";
import { requireAuth } from "../utils/authMiddleware.js";

const router = Router();

// Protect all progress routes with JWT
router.use(requireAuth);

router.get("/:roadmapId", ProgressController.getProgress);
router.patch("/:roadmapId", ProgressController.updateProgress);

export default router;
