import Enrollment from "../models/Enrollment.js";
import Roadmap from "../models/Roadmap.js";
import mongoose from "mongoose";
export class EnrollmentService {
    /**
     * Enroll a user in a roadmap.
     * Enforces duplicate protection and checks roadmap validity.
     */
    static async enrollUser(userId, roadmapId) {
        // 1. Verify roadmap exists
        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap) {
            throw new Error("Roadmap not found.");
        }
        // 2. Check duplicate enrollment
        const existing = await Enrollment.findOne({ userId, roadmapId });
        if (existing) {
            throw new Error("Already enrolled in this roadmap.");
        }
        // 3. Create enrollment
        const enrollment = await Enrollment.create({
            userId,
            roadmapId,
            progress: 0,
            completedWeeks: [],
            status: "active"
        });
        return enrollment;
    }
    /**
     * Retrieve all enrollments of the logged-in user with populated roadmap data.
     */
    static async getMyEnrollments(userId) {
        return Enrollment.find({ userId })
            .populate("roadmapId")
            .sort({ enrolledAt: -1 })
            .lean();
    }
    /**
     * Retrieve a single enrollment by ID, validating ownership.
     */
    static async getEnrollmentById(userId, id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("Invalid enrollment ID format.");
        }
        const enrollment = await Enrollment.findOne({ _id: id, userId }).populate("roadmapId");
        if (!enrollment) {
            throw new Error("Enrollment not found or unauthorized.");
        }
        return enrollment;
    }
}
