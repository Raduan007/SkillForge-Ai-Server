import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../utils/authMiddleware.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";

const router = Router();

// POST /api/ai/roadmap
router.post("/roadmap", requireAuth, async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const {
    careerGoal,
    currentExperience,
    existingSkills,
    weeklyStudyHours,
    preferredLearningStyle,
    targetCompletionTime,
  } = req.body;

  // Validation
  if (!careerGoal) {
    sendFail(res, 400, "Career Goal is required.");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendFail(res, 500, "Gemini API key is not configured on this server.");
    return;
  }

  const prompt = `
You are an expert career counselor and education planner.
Generate a personalized, structured learning roadmap for a user with the following profile:
- Career Goal: ${careerGoal}
- Current Experience: ${currentExperience || "None specified"}
- Existing Skills: ${existingSkills || "None specified"}
- Weekly Study Hours: ${weeklyStudyHours || "10"} hours/week
- Preferred Learning Style: ${preferredLearningStyle || "Mixed"}
- Target Completion Time: ${targetCompletionTime || "3 months"}

You must return a JSON object matching this structure EXACTLY:
{
  "roadmap": {
    "title": "Roadmap title based on goal",
    "description": "Short explanation of the customized path",
    "category": "Technology sector category (e.g. Frontend, Backend, Data Science, AI)",
    "difficulty": "Beginner or Intermediate or Advanced"
  },
  "milestones": [
    {
      "week": 1,
      "title": "Week theme/topic",
      "topics": ["subtopic A", "subtopic B"],
      "description": "Weekly task explanation"
    }
  ],
  "skills": ["skill 1", "skill 2"],
  "projects": [
    {
      "title": "Project name",
      "description": "Details of the portfolio project to build",
      "difficulty": "Easy/Medium/Hard"
    }
  ],
  "resources": [
    {
      "title": "Suggested book, video course, or documentation site",
      "url": "https://...",
      "type": "Video or Article or Documentation"
    }
  ],
  "estimatedDuration": "Total months/weeks estimated"
}
Do not return any markdown wraps (like \`\`\`json) outside the JSON output. Just output raw valid JSON.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout limit

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[AIRoutes] Gemini API returned error:", response.status, errorText);
      sendFail(res, 502, "AI service provider returned an error state.");
      return;
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      sendFail(res, 502, "AI service provider returned an empty candidate list.");
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      console.error("[AIRoutes] JSON Parse Error from AI response:", text, parseError);
      sendFail(res, 502, "Failed to parse AI response as valid JSON.");
      return;
    }

    // Verify properties
    if (!parsedData.roadmap || !parsedData.milestones || !parsedData.skills) {
      sendFail(res, 502, "AI response structure does not match the required roadmap schema.");
      return;
    }

    sendOk(res, 200, parsedData);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.error("[AIRoutes] Gemini API timed out after 20 seconds.");
      sendFail(res, 504, "AI request timed out. Please try again.");
      return;
    }
    console.error("[AIRoutes] API call exception:", err);
    sendFail(res, 502, "Network or system error occurred while generating the roadmap.");
  }
});

export default router;
