import { z } from "zod";

export const createRoadmapValidation = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  slug: z.string().min(3, "Slug must be at least 3 characters long"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters long"),
  fullDescription: z.string().min(20, "Full description must be at least 20 characters long"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  category: z.string().min(2, "Category must be at least 2 characters long"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().min(2, "Duration is required"),
  rating: z.number().min(0).max(5).optional().default(4.5),
  totalRatings: z.number().int().min(0).optional().default(0),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  learningOutcomes: z.array(z.string()).min(1, "At least one learning outcome is required"),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
});

export const updateRoadmapValidation = createRoadmapValidation.partial();

export const queryRoadmapValidation = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 12)),
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  sort: z.enum(["newest", "rating", "title"]).optional().default("newest"),
});

export const addItemValidation = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
  fullDescription: z.string().min(30, "Full description must be at least 30 characters"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().min(1, "Duration is required"),
  rating: z.number().min(1.0).max(5.0).optional().default(4.5),
  coverImage: z.string().min(1, "Cover image URL is required"),
});
