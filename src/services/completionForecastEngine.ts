import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import Roadmap from "../models/Roadmap.js";

export interface RoadmapForecast {
  roadmapId: string;
  title: string;
  remainingNodes: number;
  progressRate: number; // nodes per day
  daysToComplete: number;
}

export interface ForecastResult {
  roadmapForecasts: RoadmapForecast[];
  totalDaysToCompleteAll: number;
}

export class CompletionForecastEngine {
  /**
   * Forecasts the time needed to complete current roadmaps based on user progress patterns.
   */
  static async forecast(userId: string, currentStreak: number = 0): Promise<ForecastResult> {
    try {
      const enrollments = await Enrollment.find({ userId, status: "active" }).populate("roadmapId");
      const progressRecords = await Progress.find({ userId });

      const forecasts: RoadmapForecast[] = [];
      let totalDaysToCompleteAll = 0;

      for (const e of enrollments) {
        const roadmap = e.roadmapId as any;
        if (!roadmap) continue;

        const progress = progressRecords.find((p: any) => p.roadmapId.toString() === roadmap._id.toString());
        const completedNodesCount = progress?.completedNodes?.length || 0;
        const totalNodesCount = roadmap.skills?.length || 8; // fallback to 8 if not defined
        const remainingNodes = Math.max(0, totalNodesCount - completedNodesCount);

        if (remainingNodes === 0) {
          forecasts.push({
            roadmapId: roadmap._id.toString(),
            title: roadmap.title,
            remainingNodes: 0,
            progressRate: 0,
            daysToComplete: 0
          });
          continue;
        }

        // Calculate progress rate (nodes completed per day since enrollment)
        const enrolledDate = e.enrolledAt ? new Date(e.enrolledAt) : new Date(e.createdAt);
        const diffMs = Math.abs(Date.now() - enrolledDate.getTime());
        const elapsedDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        let progressRate = completedNodesCount / elapsedDays;

        // Apply a fallback rate if progress rate is 0 or extremely low (below 0.05 per day)
        // Adjust fallback based on streak consistency to reward active learners
        const streakBonus = Math.min(0.2, currentStreak * 0.02); // max 0.2 nodes/day bonus
        const defaultBaseRate = 0.15; // default base rate (roughly 1 node every 7 days)
        const minRate = defaultBaseRate + streakBonus;

        if (progressRate < minRate) {
          progressRate = minRate;
        }

        const daysToComplete = Math.ceil(remainingNodes / progressRate);
        forecasts.push({
          roadmapId: roadmap._id.toString(),
          title: roadmap.title,
          remainingNodes,
          progressRate: parseFloat(progressRate.toFixed(3)),
          daysToComplete
        });

        // Add to total sum (assuming sequential learning or general study pool)
        totalDaysToCompleteAll += daysToComplete;
      }

      return {
        roadmapForecasts: forecasts,
        totalDaysToCompleteAll
      };
    } catch (err) {
      console.error("[CompletionForecastEngine] Error generating forecast:", err);
      return {
        roadmapForecasts: [],
        totalDaysToCompleteAll: 0
      };
    }
  }
}
