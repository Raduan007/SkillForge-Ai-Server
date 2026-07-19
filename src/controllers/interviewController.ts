import { Request, Response } from "express";
import InterviewSession from "../models/InterviewSession.js";
import { sendFail, sendOk } from "../utils/apiResponse.js";
import { z } from "zod";

const createSessionSchema = z.object({
  category: z.string(),
  difficulty: z.string(),
  questions: z.array(z.string()),
  answers: z.array(z.string()),
  scores: z.object({
    technicalAccuracy: z.number(),
    problemSolving: z.number(),
    communication: z.number(),
    depth: z.number(),
    overall: z.number(),
  }),
  feedback: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    improvementSuggestions: z.array(z.string()),
  }),
});

export const getInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendFail(res, 401, "Unauthorized");
      return;
    }

    const sessions = await InterviewSession.find({ userId }).sort({ completionDate: -1 });
    sendOk(res, 200, "Interviews fetched successfully", sessions);
  } catch (error) {
    console.error("Error fetching interviews:", error);
    sendFail(res, 500, "Internal Server Error");
  }
};

export const saveInterviewSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendFail(res, 401, "Unauthorized");
      return;
    }

    const result = createSessionSchema.safeParse(req.body);
    if (!result.success) {
      sendFail(res, 400, "Invalid request body", result.error.errors);
      return;
    }

    const { category, difficulty, questions, answers, scores, feedback } = result.data;

    const newSession = new InterviewSession({
      userId,
      category,
      difficulty,
      questions,
      answers,
      scores,
      feedback,
      completionDate: new Date(),
    });

    await newSession.save();
    sendOk(res, 201, "Interview session saved successfully", newSession);
  } catch (error) {
    console.error("Error saving interview session:", error);
    sendFail(res, 500, "Internal Server Error");
  }
};
