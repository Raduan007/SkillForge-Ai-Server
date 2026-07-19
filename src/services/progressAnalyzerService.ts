import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import Achievement from "../models/Achievement.js";
import Streak from "../models/Streak.js";
import Roadmap from "../models/Roadmap.js";

export interface ProgressAnalysisResult {
  totalEnrolled: number;
  activeCount: number;
  completedCount: number;
  averageProgress: number;
  currentStreak: number;
  bestStreak: number;
  achievementCount: number;
  lastActivityDate: Date | null;
  strengths: string[];
  weaknesses: string[];
}

export class ProgressAnalyzerService {
  /**
   * Analyzes user progress across all enrolled roadmaps and platform metadata.
   */
  static async analyze(userId: string): Promise<ProgressAnalysisResult> {
    try {
      const enrollments = await Enrollment.find({ userId }).populate("roadmapId");
      const progressRecords = await Progress.find({ userId }).populate("roadmapId");
      const achievements = await Achievement.find({ userId });
      const streak = await Streak.findOne({ userId });

      const totalEnrolled = enrollments.length;
      const completedCount = enrollments.filter((e: any) => e.status === "completed" || e.progress === 100).length;
      const activeCount = totalEnrolled - completedCount;

      let totalProgressSum = 0;
      enrollments.forEach((e: any) => {
        totalProgressSum += e.progress || 0;
      });
      const averageProgress = totalEnrolled > 0 ? Math.round(totalProgressSum / totalEnrolled) : 0;

      const currentStreak = streak ? streak.currentStreak : 0;
      const bestStreak = streak ? streak.bestStreak : 0;
      const achievementCount = achievements.length;

      // Find the latest activity date
      let lastActivityDate: Date | null = null;
      if (streak && streak.lastActiveDate) {
        lastActivityDate = new Date(streak.lastActiveDate);
      }
      progressRecords.forEach((p: any) => {
        if (p.lastActivity) {
          const actDate = new Date(p.lastActivity);
          if (!lastActivityDate || actDate > lastActivityDate) {
            lastActivityDate = actDate;
          }
        }
      });
      enrollments.forEach((e: any) => {
        if (e.updatedAt) {
          const updDate = new Date(e.updatedAt);
          if (!lastActivityDate || updDate > lastActivityDate) {
            lastActivityDate = updDate;
          }
        }
      });

      // Strengths & Weaknesses Identification
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      // 1. Identify Strengths
      if (completedCount > 0) {
        strengths.push(`Completed ${completedCount} learning pathway(s) completely.`);
      }

      const bestPerforming = enrollments.reduce((max: any, curr: any) => {
        return (curr.progress > (max?.progress || 0)) ? curr : max;
      }, null);

      if (bestPerforming && bestPerforming.progress > 0) {
        const title = bestPerforming.roadmapId?.title || "Active Path";
        strengths.push(`Strongest progress on "${title}" with ${bestPerforming.progress}% completion.`);
      }

      const totalCompletedNodes = progressRecords.reduce((sum: number, curr: any) => {
        return sum + (curr.completedNodes?.length || 0);
      }, 0);

      if (totalCompletedNodes >= 5) {
        strengths.push(`Mastered a total of ${totalCompletedNodes} skills/nodes across all curriculums.`);
      }

      if (currentStreak >= 3) {
        strengths.push(`Maintaining a learning consistency streak of ${currentStreak} consecutive days.`);
      }

      // 2. Identify Weaknesses
      const inactiveRoadmaps = enrollments.filter((e: any) => e.progress < 20 && e.status !== "completed");
      inactiveRoadmaps.forEach((e: any) => {
        const title = e.roadmapId?.title || "Active Path";
        weaknesses.push(`Low initial progress on "${title}" (${e.progress}% completed).`);
      });

      if (lastActivityDate) {
        const diffTime = Math.abs(Date.now() - lastActivityDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 5) {
          weaknesses.push(`Extended inactivity period: No study actions recorded in the past ${diffDays} days.`);
        }
      } else if (totalEnrolled > 0) {
        weaknesses.push("No progress or study activities recorded yet.");
      }

      if (totalEnrolled > 1 && completedCount === 0 && averageProgress < 10) {
        weaknesses.push("Splitting focus across multiple roadmaps without finishing initial milestones.");
      }

      // Fallback defaults
      if (strengths.length === 0) {
        strengths.push("Learning journey started. Complete your first roadmap skill to identify core strengths!");
      }
      if (weaknesses.length === 0) {
        weaknesses.push("Excellent work! No notable study gaps or long inactive periods detected.");
      }

      return {
        totalEnrolled,
        activeCount,
        completedCount,
        averageProgress,
        currentStreak,
        bestStreak,
        achievementCount,
        lastActivityDate,
        strengths,
        weaknesses
      };
    } catch (err) {
      console.error("[ProgressAnalyzerService] Error analyzing progress:", err);
      return {
        totalEnrolled: 0,
        activeCount: 0,
        completedCount: 0,
        averageProgress: 0,
        currentStreak: 0,
        bestStreak: 0,
        achievementCount: 0,
        lastActivityDate: null,
        strengths: ["Journey started."],
        weaknesses: ["No study data found."]
      };
    }
  }
}
