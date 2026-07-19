import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  roadmapId: mongoose.Types.ObjectId;
  completedNodes: string[];
  progressPercentage: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true, index: true },
    completedNodes: { type: [String], default: [] },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastActivity: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Unique compound index for user progress per roadmap path
ProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export default mongoose.models.Progress || mongoose.model<IProgress>("Progress", ProgressSchema);
