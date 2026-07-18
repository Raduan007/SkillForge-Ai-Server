import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { RoadmapService } from "../services/roadmapService.js";
import { queryRoadmapValidation, addItemValidation } from "../validations/roadmapValidation.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

export class RoadmapController {
  /**
   * GET /api/roadmaps
   * Fetches paginated, sorted, and filtered roadmaps list.
   */
  static async getRoadmaps(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roadmaps/:slug
   * Fetches a single roadmap by its unique slug identifier.
   */
  static async getRoadmapBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roadmaps/:id
   * Fetches a single roadmap by its ID.
   */
  static async getRoadmapById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        sendFail(res, 400, "Invalid roadmap ID format.");
        return;
      }

      const roadmap = await RoadmapService.getRoadmapById(id);
      if (!roadmap) {
        sendFail(res, 404, "Roadmap not found.");
        return;
      }

      sendOk(res, 200, roadmap);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roadmaps/featured
   * Fetches the featured roadmaps (maximum 4).
   */
  static async getFeaturedRoadmaps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmaps = await RoadmapService.getFeaturedRoadmaps();
      sendOk(res, 200, roadmaps);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roadmaps/popular
   * Fetches top 8 highest-rated roadmaps.
   */
  static async getPopularRoadmaps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmaps = await RoadmapService.getPopularRoadmaps();
      sendOk(res, 200, roadmaps);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roadmaps/latest
   * Fetches top 8 most recently created roadmaps.
   */
  static async getLatestRoadmaps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmaps = await RoadmapService.getLatestRoadmaps();
      sendOk(res, 200, roadmaps);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories
   * Retrieves unique, alphabetically sorted categories dynamically from MongoDB.
   */
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await RoadmapService.getCategories();
      sendOk(res, 200, categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roadmaps
   * Create and register a new career roadmap.
   */
  static async createRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = addItemValidation.safeParse(req.body);
      if (!parsed.success) {
        sendFail(res, 400, "Validation failed", parsed.error.issues);
        return;
      }

      const newRoadmap = await RoadmapService.createRoadmap(parsed.data);
      sendOk(res, 201, newRoadmap);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/roadmaps/:id
   * Delete a career roadmap by ID.
   */
  static async deleteRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        sendFail(res, 400, "Invalid roadmap ID format.");
        return;
      }

      const deletedRoadmap = await RoadmapService.deleteRoadmap(id);
      if (!deletedRoadmap) {
        sendFail(res, 404, "Roadmap not found.");
        return;
      }

      sendOk(res, 200, { message: "Roadmap deleted successfully." });
    } catch (error) {
      next(error);
    }
  }
}
