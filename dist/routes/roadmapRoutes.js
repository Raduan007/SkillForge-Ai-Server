import { Router } from "express";
import { RoadmapController } from "../controllers/roadmapController.js";
import { requireAuth } from "../utils/authMiddleware.js";
import mongoose from "mongoose";
import { sendFail } from "../utils/apiResponse.js";
const router = Router();
router.get("/", RoadmapController.getRoadmaps);
router.post("/", requireAuth, RoadmapController.createRoadmap);
router.get("/featured", RoadmapController.getFeaturedRoadmaps);
router.get("/popular", RoadmapController.getPopularRoadmaps);
router.get("/latest", RoadmapController.getLatestRoadmaps);
router.delete("/:id", requireAuth, RoadmapController.deleteRoadmap);
// Match 24-character IDs specifically and handle or return 400
router.get("/:id", (req, res, next) => {
    const id = req.params.id;
    if (id && id.length === 24) {
        if (mongoose.Types.ObjectId.isValid(id)) {
            return RoadmapController.getRoadmapById(req, res, next);
        }
        else {
            sendFail(res, 400, "Invalid roadmap ID format.");
            return;
        }
    }
    next();
});
router.get("/:slug", RoadmapController.getRoadmapBySlug);
export default router;
