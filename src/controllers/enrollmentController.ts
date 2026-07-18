import { Request, Response, NextFunction } from "express";
import { EnrollmentService } from "../services/enrollmentService.js";
import { createEnrollmentValidation } from "../validations/enrollmentValidation.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

export class EnrollmentController {
  /**
   * POST /api/enrollments
   * Enrolls the authenticated user in a roadmap.
   */
  static async enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate schema
      const parsedBody = createEnrollmentValidation.safeParse(req.body);
      if (!parsedBody.success) {
        sendFail(res, 400, "Invalid enrollment data structure.");
        return;
      }

      // Check authentication identity
      const userId = (req as any).user?._id;
      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      const enrollment = await EnrollmentService.enrollUser(userId, parsedBody.data.roadmapId);
      sendOk(res, 201, enrollment);
    } catch (error: any) {
      if (error.message === "Already enrolled in this roadmap.") {
        sendFail(res, 400, error.message);
      } else if (error.message === "Roadmap not found.") {
        sendFail(res, 404, error.message);
      } else {
        next(error);
      }
    }
  }

  /**
   * GET /api/enrollments/my
   * Retrieves all enrollments of the logged-in user.
   */
  static async getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      const enrollments = await EnrollmentService.getMyEnrollments(userId);
      sendOk(res, 200, enrollments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/enrollments/:id
   * Retrieves detailed status for a single enrollment.
   */
  static async getEnrollmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        sendFail(res, 401, "Unauthorized access.");
        return;
      }

      const id = req.params.id as string;
      const enrollment = await EnrollmentService.getEnrollmentById(userId, id);
      sendOk(res, 200, enrollment);
    } catch (error: any) {
      if (error.message === "Enrollment not found or unauthorized.") {
        sendFail(res, 404, error.message);
      } else if (error.message === "Invalid enrollment ID format.") {
        sendFail(res, 400, error.message);
      } else {
        next(error);
      }
    }
  }
}
