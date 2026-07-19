import mongoose from "mongoose";
import Progress from "../models/Progress.js";
import Roadmap from "../models/Roadmap.js";
import Enrollment from "../models/Enrollment.js";

export class ProgressService {
  /**
   * Fetch user progress details for a specific roadmap (supports roadmap ID or slug).
   */
  static async getProgress(userId: string, roadmapIdOrSlug: string) {
    const roadmapQuery = mongoose.Types.ObjectId.isValid(roadmapIdOrSlug)
      ? { _id: roadmapIdOrSlug }
      : { slug: roadmapIdOrSlug.toLowerCase() };

    const roadmap = await Roadmap.findOne(roadmapQuery);
    if (!roadmap) {
      throw new Error("Roadmap not found");
    }

    let progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
    if (!progress) {
      progress = await Progress.create({
        userId: new mongoose.Types.ObjectId(userId),
        roadmapId: roadmap._id,
        completedNodes: [],
        progressPercentage: 0,
        lastActivity: new Date()
      });
    }

    return progress;
  }

  /**
   * Update completed nodes list and automatically calculate progress percentage.
   */
  static async updateProgress(userId: string, roadmapIdOrSlug: string, completedNodes: string[]) {
    const roadmapQuery = mongoose.Types.ObjectId.isValid(roadmapIdOrSlug)
      ? { _id: roadmapIdOrSlug }
      : { slug: roadmapIdOrSlug.toLowerCase() };

    const roadmap = await Roadmap.findOne(roadmapQuery);
    if (!roadmap) {
      throw new Error("Roadmap not found");
    }

    // Filter nodes to make sure they belong to the roadmap's skills list
    const validNodes = completedNodes.filter((node) => roadmap.skills.includes(node));

    const totalNodes = roadmap.skills.length || 1;
    const progressPercentage = Math.round((validNodes.length / totalNodes) * 100);

    const progress = await Progress.findOneAndUpdate(
      { userId, roadmapId: roadmap._id },
      {
        completedNodes: validNodes,
        progressPercentage,
        lastActivity: new Date()
      },
      { new: true, upsert: true }
    );

    // Sync progress rate and status back to the Enrollment document
    await Enrollment.findOneAndUpdate(
      { userId, roadmapId: roadmap._id },
      {
        progress: progressPercentage,
        status: progressPercentage === 100 ? "completed" : "active"
      }
    );

    return progress;
  }
}
