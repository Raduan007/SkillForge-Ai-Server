import { z } from "zod";
export const createEnrollmentValidation = z.object({
    roadmapId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: "Invalid roadmap ID format."
    })
});
