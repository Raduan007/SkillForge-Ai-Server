import { Request, Response, NextFunction } from "express";
import { AchievementService } from "../services/achievementService.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

export class AchievementController {
  /**
   * GET /api/achievements
   * Retrieves all achievements for the authenticated user (unlocked + locked).
   */
  static async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      const achievements = await AchievementService.getUserAchievements(userId);
      sendOk(res, 200, achievements);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/streak
   * Retrieves the authenticated user's current and best daily learning streak parameters.
   */
  static async getStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      const streak = await AchievementService.getStreak(userId);
      sendOk(res, 200, streak);
    } catch (error) {
      next(error);
    }
  }
}
