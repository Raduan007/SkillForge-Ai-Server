import { Router } from "express";
import { RoadmapController } from "../controllers/roadmapController.js";
import { requireAuth } from "../utils/authMiddleware.js";

const router = Router();

router.get("/", RoadmapController.getRoadmaps);
router.post("/", requireAuth, RoadmapController.createRoadmap);
router.get("/featured", RoadmapController.getFeaturedRoadmaps);
router.get("/popular", RoadmapController.getPopularRoadmaps);
router.get("/latest", RoadmapController.getLatestRoadmaps);
router.get("/:slug", RoadmapController.getRoadmapBySlug);

export default router;
