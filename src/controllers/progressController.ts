import { Request, Response, NextFunction } from "express";
import { ProgressService } from "../services/progressService.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";
import { z } from "zod";

const updateProgressSchema = z.object({
  completedNodes: z.array(z.string())
});

export class ProgressController {
  /**
   * GET /api/progress/:roadmapId
   * Retrieves the authenticated user's progress for a specific roadmap.
   */
  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmapIdOrSlug = req.params.roadmapId as string;
      const userId = (req as any).user?._id;

      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      if (!roadmapIdOrSlug) {
        sendFail(res, 400, "Roadmap identifier is required.");
        return;
      }

      const progress = await ProgressService.getProgress(userId, roadmapIdOrSlug);
      sendOk(res, 200, progress);
    } catch (error: any) {
      if (error.message === "Roadmap not found") {
        sendFail(res, 404, error.message);
      } else {
        next(error);
      }
    }
  }

  /**
   * PATCH /api/progress/:roadmapId
   * Updates the completed nodes list and updates course progress percentage.
   */
  static async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmapIdOrSlug = req.params.roadmapId as string;
      const userId = (req as any).user?._id;

      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      if (!roadmapIdOrSlug) {
        sendFail(res, 400, "Roadmap identifier is required.");
        return;
      }

      const parseResult = updateProgressSchema.safeParse(req.body);
      if (!parseResult.success) {
        sendFail(res, 400, "Invalid request body structure.");
        return;
      }

      const progress = await ProgressService.updateProgress(
        userId,
        roadmapIdOrSlug,
        parseResult.data.completedNodes
      );
      sendOk(res, 200, progress);
    } catch (error: any) {
      if (error.message === "Roadmap not found") {
        sendFail(res, 404, error.message);
      } else {
        next(error);
      }
    }
  }
}
