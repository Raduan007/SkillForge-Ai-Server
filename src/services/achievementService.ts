import mongoose from "mongoose";
import Achievement from "../models/Achievement.js";
import Streak from "../models/Streak.js";
import Progress from "../models/Progress.js";

export const PREDEFINED_ACHIEVEMENTS = [
  {
    type: "first_step",
    title: "First Step",
    description: "Complete your first skill node on any roadmap pathway",
    icon: "Target",
  },
  {
    type: "explorer",
    title: "Explorer",
    description: "Reach 25% progress on any learning roadmap",
    icon: "Compass",
  },
  {
    type: "dedicated_learner",
    title: "Dedicated Learner",
    description: "Reach 50% progress on any learning roadmap",
    icon: "Flame",
  },
  {
    type: "roadmap_master",
    title: "Roadmap Master",
    description: "Complete a learning roadmap (100% progress)",
    icon: "Award",
  },
  {
    type: "consistency_hero",
    title: "Consistency Hero",
    description: "Maintain a 7-day daily learning streak",
    icon: "Trophy",
  },
  {
    type: "skillforge_champion",
    title: "SkillForge Champion",
    description: "Complete 3 learning roadmaps (100% progress)",
    icon: "Shield",
  },
];

export class AchievementService {
  /**
   * Evaluates and unlocks any achievements the user qualifies for.
   */
  static async evaluateAchievements(userId: string) {
    const uId = new mongoose.Types.ObjectId(userId);

    // 1. First Step Check
    const hasFirstStep = await Progress.exists({ userId: uId, "completedNodes.0": { $exists: true } });
    if (hasFirstStep) {
      await this.unlockAchievement(userId, "first_step");
    }

    // 2. Explorer Check (>= 25%)
    const hasExplorer = await Progress.exists({ userId: uId, progressPercentage: { $gte: 25 } });
    if (hasExplorer) {
      await this.unlockAchievement(userId, "explorer");
    }

    // 3. Dedicated Learner Check (>= 50%)
    const hasDedicated = await Progress.exists({ userId: uId, progressPercentage: { $gte: 50 } });
    if (hasDedicated) {
      await this.unlockAchievement(userId, "dedicated_learner");
    }

    // 4. Roadmap Master Check (100%)
    const hasMaster = await Progress.exists({ userId: uId, progressPercentage: 100 });
    if (hasMaster) {
      await this.unlockAchievement(userId, "roadmap_master");
    }

    // 5. Consistency Hero Check (7 Day Streak)
    const streak = await Streak.findOne({ userId: uId });
    if (streak && streak.currentStreak >= 7) {
      await this.unlockAchievement(userId, "consistency_hero");
    }

    // 6. SkillForge Champion Check (Complete 3 roadmaps)
    const completedCount = await Progress.countDocuments({ userId: uId, progressPercentage: 100 });
    if (completedCount >= 3) {
      await this.unlockAchievement(userId, "skillforge_champion");
    }
  }

  /**
   * Helper to create the achievement document if it does not already exist.
   */
  private static async unlockAchievement(userId: string, type: string) {
    const predefined = PREDEFINED_ACHIEVEMENTS.find((a) => a.type === type);
    if (!predefined) return;

    const exists = await Achievement.exists({ userId, achievementType: type });
    if (!exists) {
      await Achievement.create({
        userId: new mongoose.Types.ObjectId(userId),
        achievementType: type,
        title: predefined.title,
        description: predefined.description,
        icon: predefined.icon,
        unlockedAt: new Date(),
      });
    }
  }

  /**
   * Fetch all achievements for a user, combining unlocked logs with locked placeholders.
   */
  static async getUserAchievements(userId: string) {
    // Make sure latest updates are evaluated first
    await this.evaluateAchievements(userId);

    const unlocked = await Achievement.find({ userId });
    const uId = new mongoose.Types.ObjectId(userId);

    // Compute progress indicators for locked achievements
    const completedProgress = await Progress.find({ userId: uId });
    const maxProgress = completedProgress.reduce((max, p) => Math.max(max, p.progressPercentage), 0);
    const totalCompletedRoadmaps = completedProgress.filter((p) => p.progressPercentage === 100).length;
    const streak = await Streak.findOne({ userId: uId });
    const currentStreakVal = streak?.currentStreak || 0;

    return PREDEFINED_ACHIEVEMENTS.map((pred) => {
      const dbUnlock = unlocked.find((u) => u.achievementType === pred.type);
      
      let progressPct = 0;
      let progressDisplay = "";

      switch (pred.type) {
        case "first_step":
          const hasNodes = completedProgress.some((p) => p.completedNodes.length > 0);
          progressPct = hasNodes ? 100 : 0;
          progressDisplay = hasNodes ? "1/1 Node" : "0/1 Node";
          break;
        case "explorer":
          progressPct = Math.min(Math.round((maxProgress / 25) * 100), 100);
          progressDisplay = `${Math.min(maxProgress, 25)}% / 25%`;
          break;
        case "dedicated_learner":
          progressPct = Math.min(Math.round((maxProgress / 50) * 100), 100);
          progressDisplay = `${Math.min(maxProgress, 50)}% / 50%`;
          break;
        case "roadmap_master":
          progressPct = Math.min(maxProgress, 100);
          progressDisplay = `${progressPct}% / 100%`;
          break;
        case "consistency_hero":
          progressPct = Math.min(Math.round((currentStreakVal / 7) * 100), 100);
          progressDisplay = `${currentStreakVal} / 7 days`;
          break;
        case "skillforge_champion":
          progressPct = Math.min(Math.round((totalCompletedRoadmaps / 3) * 100), 100);
          progressDisplay = `${totalCompletedRoadmaps} / 3 roadmaps`;
          break;
      }

      return {
        type: pred.type,
        title: pred.title,
        description: pred.description,
        icon: pred.icon,
        unlocked: !!dbUnlock,
        unlockedAt: dbUnlock?.unlockedAt || null,
        progressPercentage: progressPct,
        progressDisplay,
      };
    });
  }

  /**
   * Retrieves or initializes the user's daily learning streak.
   */
  static async getStreak(userId: string) {
    let streak = await Streak.findOne({ userId });
    
    if (!streak) {
      streak = await Streak.create({
        userId: new mongoose.Types.ObjectId(userId),
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: new Date(Date.now() - 86400000 * 2), // set to two days ago so it starts at 0
      });
    } else {
      // Check if the streak is broken (last learning day was before yesterday)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - lastActive.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak is broken!
        streak.currentStreak = 0;
        await streak.save();
      }
    }

    return streak;
  }

  /**
   * Increments/Updates the streak when activity is recorded.
   */
  static async recordActivity(userId: string) {
    let streak = await Streak.findOne({ userId });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      streak = await Streak.create({
        userId: new mongoose.Types.ObjectId(userId),
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: new Date(),
      });
    } else {
      const lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(today.getTime() - lastActive.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day!
        streak.currentStreak += 1;
        streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
        streak.lastActiveDate = new Date();
        await streak.save();
      } else if (diffDays > 1 || (streak.currentStreak === 0 && diffDays !== 0)) {
        // Streak broken or reset
        streak.currentStreak = 1;
        streak.bestStreak = Math.max(streak.bestStreak, 1);
        streak.lastActiveDate = new Date();
        await streak.save();
      } else if (diffDays === 0 && streak.currentStreak === 0) {
        // Was 0, user registers activity today -> set to 1
        streak.currentStreak = 1;
        streak.bestStreak = Math.max(streak.bestStreak, 1);
        streak.lastActiveDate = new Date();
        await streak.save();
      }
    }

    // Trigger achievement rules check
    await this.evaluateAchievements(userId);

    return streak;
  }
}
