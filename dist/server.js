import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { RoadmapService } from "./services/roadmapService.js";
import roadmapRouter from "./routes/roadmapRoutes.js";
import quizRouter from "./routes/quizRoutes.js";
import copilotRouter from "./routes/copilotRoutes.js";
import authRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import dns from "dns";
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
        dns.setServers(["8.8.8.8", "8.8.4.4"]);
    }
    catch (_e) {
        // Ignore DNS override errors
    }
}
dotenv.config();
// ─── Environment Validation ──────────────────────────────────────────────────
// Importing jwtConfig triggers validation of required JWT environment variables.
// If any are missing the module throws and the process exits before binding a port.
import { jwtConfig } from "./config/jwtConfig.js";
console.log(`[JWT] Configuration loaded — access tokens expire in ${jwtConfig.accessExpiresIn}`);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
// JSON File Database Setup (Hybrid for Quizzes/Profiles/Copilot sessions)
const DB_PATH = path.join(__dirname, "../db.json");
function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        const seedData = {
            profiles: {
                "user_default": {
                    "name": "Developer Pathfinder",
                    "level": "Beginner",
                    "streak": 3,
                    "lastActive": new Date().toISOString(),
                    "completedNodes": [],
                    "badges": ["Pathfinder Initiated"],
                    "recommendedCareers": []
                }
            },
            roadmaps: {},
            quizzes: {}
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2), "utf8");
    }
}
initDB();
// DB Helper Functions
app.locals.readDB = () => {
    try {
        const data = fs.readFileSync(DB_PATH, "utf8");
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error reading JSON DB:", error);
        return {};
    }
};
app.locals.writeDB = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    }
    catch (error) {
        console.error("Error writing JSON DB:", error);
    }
};
// Establish MongoDB Connection & Seed
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/skillforge";
mongoose
    .connect(MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB successfully!");
    // Trigger mock roadmaps database seeding checks
    RoadmapService.seedMockRoadmaps().catch((err) => {
        console.error("Failed to seed mock roadmaps database:", err);
    });
})
    .catch((err) => {
    console.error("MongoDB connection warning:", err.message);
    console.log("Verify MongoDB is running locally or specify MONGODB_URI in your .env environment.");
});
// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/roadmaps", roadmapRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/copilot", copilotRouter);
// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected", timestamp: new Date() });
});
// Profile endpoints
app.get("/api/profile", (req, res) => {
    const db = app.locals.readDB();
    res.json(db.profiles.user_default);
});
app.post("/api/profile/update-streak", (req, res) => {
    const db = app.locals.readDB();
    const profile = db.profiles.user_default;
    const lastActiveDate = new Date(profile.lastActive);
    const today = new Date();
    // Calculate difference in days
    const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
        profile.streak += 1;
        if (profile.streak === 5 && !profile.badges.includes("Consistent Learner")) {
            profile.badges.push("Consistent Learner");
        }
    }
    else if (diffDays > 1) {
        profile.streak = 1; // Reset streak
    }
    profile.lastActive = today.toISOString();
    db.profiles.user_default = profile;
    app.locals.writeDB(db);
    res.json(profile);
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
