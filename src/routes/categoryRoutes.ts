import { Router } from "express";
import { RoadmapController } from "../controllers/roadmapController.js";

const router = Router();

router.get("/", RoadmapController.getCategories);

export default router;
