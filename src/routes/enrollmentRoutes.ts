import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollmentController.js";
import { requireAuth } from "../utils/authMiddleware.js";

const router = Router();

// Protect all enrollment endpoints
router.use(requireAuth);

router.post("/", EnrollmentController.enroll);
router.get("/my", EnrollmentController.getMyEnrollments);
router.get("/:id", EnrollmentController.getEnrollmentById);

export default router;
