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
    const userId = (req as any).user?._id;
    if (!userId) {
      sendFail(res, 401, "Unauthorized");
      return;
    }

    const sessions = await InterviewSession.find({ userId }).sort({ completionDate: -1 });
    sendOk(res, 200, sessions);
  } catch (error) {
    console.error("Error fetching interviews:", error);
    sendFail(res, 500, "Internal Server Error");
  }
};

export const saveInterviewSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      sendFail(res, 401, "Unauthorized");
      return;
    }

    const result = createSessionSchema.safeParse(req.body);
    if (!result.success) {
      sendFail(res, 400, "Invalid request body", result.error.issues);
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
    sendOk(res, 201, newSession);
  } catch (error) {
    console.error("Error saving interview session:", error);
    sendFail(res, 500, "Internal Server Error");
  }
};

export const getInterviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) {
      sendFail(res, 401, "Unauthorized");
      return;
    }

    const { id } = req.params;
    const session = await InterviewSession.findById(id);

    if (!session) {
      sendFail(res, 404, "Interview not found");
      return;
    }

    // Security Check: Only allow owner or admin to access
    if (user.role !== "admin" && session.userId.toString() !== user.userId) {
      sendFail(res, 403, "Access denied. You do not own this interview.");
      return;
    }

    // Map to required JSON response format
    const responseData = {
      _id: session._id,
      category: session.category,
      difficulty: session.difficulty,
      createdAt: session.completionDate || (session as any).createdAt,
      questions: session.questions,
      answers: session.answers,
      scores: {
        technicalAccuracy: session.scores?.technicalAccuracy || 0,
        problemSolving: session.scores?.problemSolving || 0,
        communication: session.scores?.communication || 0,
        depth: session.scores?.depth || 0,
        overall: session.scores?.overall || 0,
      },
      feedback: {
        strengths: session.feedback?.strengths || [],
        weaknesses: session.feedback?.weaknesses || [],
        improvements: session.feedback?.improvementSuggestions || [],
      }
    };

    sendOk(res, 200, responseData);
  } catch (error) {
    console.error("Error fetching interview by ID:", error);
    sendFail(res, 500, "Internal Server Error");
  }
};
