import { Router } from "express";
import { requireAuth } from "../utils/authMiddleware.js";
import { getInterviews, saveInterviewSession, getInterviewById } from "../controllers/interviewController.js";

const router = Router();

router.get("/", requireAuth, getInterviews);
router.post("/", requireAuth, saveInterviewSession);
router.get("/:id", requireAuth, getInterviewById);

export default router;
