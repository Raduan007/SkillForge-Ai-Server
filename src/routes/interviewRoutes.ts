import { Router } from "express";
import { requireAuth } from "../utils/authMiddleware.js";
import { getInterviews, saveInterviewSession } from "../controllers/interviewController.js";

const router = Router();

router.get("/", requireAuth, getInterviews);
router.post("/", requireAuth, saveInterviewSession);

export default router;
