import { RoadmapService } from "../services/roadmapService.js";
import { queryRoadmapValidation } from "../validations/roadmapValidation.js";
import { sendOk } from "../utils/apiResponse.js";
export class RoadmapController {
    /**
     * GET /api/roadmaps
     * Fetches paginated, sorted, and filtered roadmaps list.
     */
    static async getRoadmaps(req, res, next) {
        try {
            // 1. Validate and Parse query parameters using Zod
            const parsedQuery = queryRoadmapValidation.safeParse(req.query);
            if (!parsedQuery.success) {
                res.status(400).json({
                    error: "Invalid query parameters structure",
                    details: parsedQuery.error.format(),
                });
                return;
            }
            // 2. Delegate query payload to Service layer
            const result = await RoadmapService.getRoadmaps(parsedQuery.data);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/roadmaps/:slug
     * Fetches a single roadmap by its unique slug identifier.
     */
    static async getRoadmapBySlug(req, res, next) {
        try {
            const slug = req.params.slug;
            if (!slug) {
                res.status(400).json({ error: "Roadmap slug parameter is required" });
                return;
            }
            const roadmap = await RoadmapService.getRoadmapBySlug(slug);
            if (!roadmap) {
                res.status(404).json({ error: `Roadmap with slug '${slug}' not found` });
                return;
            }
            res.status(200).json(roadmap);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/roadmaps/featured
     * Fetches the featured roadmaps (maximum 4).
     */
    static async getFeaturedRoadmaps(req, res, next) {
        try {
            const roadmaps = await RoadmapService.getFeaturedRoadmaps();
            sendOk(res, 200, roadmaps);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/roadmaps/popular
     * Fetches top 8 highest-rated roadmaps.
     */
    static async getPopularRoadmaps(req, res, next) {
        try {
            const roadmaps = await RoadmapService.getPopularRoadmaps();
            sendOk(res, 200, roadmaps);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/roadmaps/latest
     * Fetches top 8 most recently created roadmaps.
     */
    static async getLatestRoadmaps(req, res, next) {
        try {
            const roadmaps = await RoadmapService.getLatestRoadmaps();
            sendOk(res, 200, roadmaps);
        }
        catch (error) {
            next(error);
        }
    }
}
