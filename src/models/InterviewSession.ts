import mongoose, { Schema, Document } from "mongoose";

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  difficulty: string;
  questions: string[];
  answers: string[];
  scores: {
    technicalAccuracy: number;
    problemSolving: number;
    communication: number;
    depth: number;
    overall: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
  };
  completionDate: Date;
}

const InterviewSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
    questions: { type: [String], default: [] },
    answers: { type: [String], default: [] },
    scores: {
      technicalAccuracy: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    feedback: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      improvementSuggestions: { type: [String], default: [] },
    },
    completionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewSession>("InterviewSession", InterviewSessionSchema);
