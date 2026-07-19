import mongoose, { Schema, Document } from "mongoose";

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    achievementType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate unlocked achievements for the same user
AchievementSchema.index({ userId: 1, achievementType: 1 }, { unique: true });

export default mongoose.models.Achievement || mongoose.model<IAchievement>("Achievement", AchievementSchema);
