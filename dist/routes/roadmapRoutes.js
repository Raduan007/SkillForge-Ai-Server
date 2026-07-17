import { Router } from "express";
import { RoadmapController } from "../controllers/roadmapController.js";
const router = Router();
router.get("/", RoadmapController.getRoadmaps);
router.get("/:slug", RoadmapController.getRoadmapBySlug);
export default router;
