import mongoose, { Schema, Document } from "mongoose";

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Streak || mongoose.model<IStreak>("Streak", StreakSchema);
