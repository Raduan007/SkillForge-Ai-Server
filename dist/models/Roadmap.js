import mongoose, { Schema } from "mongoose";
const RoadmapSchema = new Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    coverImage: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficulty: {
        type: String,
        required: true,
        enum: ["Beginner", "Intermediate", "Advanced"],
        index: true,
    },
    duration: { type: String, required: true },
    rating: { type: Number, required: true, default: 4.5 },
    totalRatings: { type: Number, required: true, default: 0 },
    skills: { type: [String], required: true, default: [] },
    learningOutcomes: { type: [String], required: true, default: [] },
    isFeatured: { type: Boolean, required: true, default: false, index: true },
    isPublished: { type: Boolean, required: true, default: true, index: true },
}, {
    timestamps: true,
});
// Add text index on title for full-text search capability if needed (or regex search in service)
RoadmapSchema.index({ title: "text", shortDescription: "text" });
export default mongoose.models.Roadmap || mongoose.model("Roadmap", RoadmapSchema);
