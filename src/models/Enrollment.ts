import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  roadmapId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  progress: number;
  completedWeeks: number[];
  status: "active" | "completed";
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedWeeks: { type: [Number], default: [] },
    status: { type: String, enum: ["active", "completed"], default: "active", index: true }
  },
  {
    timestamps: true
  }
);

// Enforce compound unique index for a single enrollment per user-roadmap
EnrollmentSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export default mongoose.models.Enrollment || mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
