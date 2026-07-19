import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../utils/authMiddleware.js";
import { sendOk, sendFail } from "../utils/apiResponse.js";
import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import Achievement from "../models/Achievement.js";
import Streak from "../models/Streak.js";
import { ProgressAnalyzerService } from "../services/progressAnalyzerService.js";
import { CompletionForecastEngine } from "../services/completionForecastEngine.js";
import { RecommendationEngine } from "../services/recommendationEngine.js";

const router = Router();

async function compileUserContext(userId: any, name: string): Promise<string> {
  try {
    const enrollments = await Enrollment.find({ userId }).populate("roadmapId");
    const progressRecords = await Progress.find({ userId }).populate("roadmapId");
    const achievements = await Achievement.find({ userId });
    const streak = await Streak.findOne({ userId });

    const roadmapsStr = enrollments.length > 0
      ? enrollments.map((e: any) => {
          const title = e.roadmapId?.title || "Unknown Path";
          const progress = e.progress || 0;
          const status = e.status || "active";
          return `- ${title} (${progress}% completed, status: ${status})`;
        }).join("\n")
      : "None";

    const progressStr = progressRecords.length > 0
      ? progressRecords.map((p: any) => {
          const title = p.roadmapId?.title || "Unknown Path";
          const completedCount = p.completedNodes?.length || 0;
          return `- ${title}: Completed ${completedCount} skills: [${(p.completedNodes || []).join(", ")}] (${p.progressPercentage}% progress)`;
        }).join("\n")
      : "None";

    const achievementsStr = achievements.length > 0
      ? achievements.map((a: any) => `- ${a.title}: ${a.description}`).join("\n")
      : "None";

    const streakStr = streak
      ? `${streak.currentStreak} consecutive learning days (Best record: ${streak.bestStreak} days)`
      : "0 days";

    // Run AI Learning Analytics Engines
    const analysis = await ProgressAnalyzerService.analyze(userId.toString());
    const forecast = await CompletionForecastEngine.forecast(userId.toString(), analysis.currentStreak);
    const recommendations = await RecommendationEngine.generate(userId.toString());

    // Compile Forecast String
    const forecastStr = forecast.roadmapForecasts.length > 0
      ? forecast.roadmapForecasts.map((f: any) => {
          return `- "${f.title}": ${f.remainingNodes} remaining skills. Estimated ${f.daysToComplete} days to complete (based on rate of ${f.progressRate} nodes/day).`;
        }).join("\n")
      : "None";

    // Compile Motivation Coaching Message
    let motivationMessage = "You are doing great! Keep setting incremental daily goals to maintain your progress.";
    if (analysis.averageProgress < 20) {
      motivationMessage = "It looks like you are just getting started or taking a small pause. Try setting a smaller, micro-goal of completing just one skill node today to rebuild your learning momentum!";
    } else if (analysis.averageProgress >= 50) {
      motivationMessage = "Outstanding work! You have mastered a significant portion of your active pathways. Consider exploring an Advanced learning roadmap next, or begin building your active portfolio project to solidify your skills!";
    }

    return `User:
${name}

Enrolled Roadmaps:
${roadmapsStr}

Progress:
${progressStr}

Achievements:
${achievementsStr}

Current Streak:
${streakStr}

--- LEARNING ANALYTICS REPORT ---
Total Enrolled: ${analysis.totalEnrolled}
Active pathways: ${analysis.activeCount}
Completed pathways: ${analysis.completedCount}
Average Progress: ${analysis.averageProgress}%
Achievements: ${analysis.achievementCount}
Current Streak: ${analysis.currentStreak} days
Last Active Date: ${analysis.lastActivityDate ? new Date(analysis.lastActivityDate).toLocaleDateString() : "No activity recorded yet"}

Strengths:
${analysis.strengths.map(s => `- ${s}`).join("\n")}

Weaknesses:
${analysis.weaknesses.map(w => `- ${w}`).join("\n")}

Completion Forecast:
${forecastStr}
- Total estimated days remaining: ${forecast.totalDaysToCompleteAll} days

Learning Recommendations:
- Next Skill To Learn: ${recommendations.nextSkill}
- Target Roadmap: ${recommendations.nextRoadmapTitle}
- Suggested Portfolio Project: "${recommendations.suggestedProject.title}"
  Description: ${recommendations.suggestedProject.description}

7-Day Study Plan:
${recommendations.studyPlan.map(day => `- ${day}`).join("\n")}

Motivation Coach Note:
${motivationMessage}`;
  } catch (error) {
    console.error("Error compiling user context:", error);
    return `User:\n${name}\n\nEnrolled Roadmaps:\nNone\n\nProgress:\nNone\n\nAchievements:\nNone\n\nCurrent Streak:\n0 days`;
  }
}

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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

// POST /api/ai/chat
router.post("/chat", requireAuth, async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { message, history } = req.body;

  if (!message) {
    sendFail(res, 400, "Message content is required.");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendFail(res, 500, "Gemini API key is not configured on this server.");
    return;
  }

  // Format history to Gemini's expected contents array:
  const contents = Array.isArray(history)
    ? history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: String(msg.content) }],
      }))
    : [];

  // Append user's current message
  contents.push({
    role: "user",
    parts: [{ text: String(message) }],
  });

  const user = (req as any).user;
  const context = await compileUserContext(user._id, user.name);

  const systemPrompt = `You are a friendly, encouraging, and highly professional Career Mentor on the SkillForge AI platform.
Your goals are to:
- Guide the user on their learning paths and career choices.
- Guide the user using their real platform profile, enrollments, achievements, and learning streak details:
${context}
- Explain technical programming concepts clearly (e.g. databases, programming languages, TypeScript generics, framework comparisons like React vs Vue).
- Recommend programming languages, stack components, study methodologies, interview prep tips, and portfolio projects.
- Be concise and structure your responses cleanly with lists, bold text, and code syntax blocks.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout limit

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[AIRoutes] Gemini Chat API returned error status:", response.status, errorText);
      sendFail(res, 502, "AI service provider returned an error state.");
      return;
    }

    const json = await response.json();
    const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      sendFail(res, 502, "AI service provider returned an empty chat candidate response.");
      return;
    }

    const usage = {
      promptTokens: json.usageMetadata?.promptTokenCount || 0,
      completionTokens: json.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: json.usageMetadata?.totalTokenCount || 0,
    };

    sendOk(res, 200, {
      reply,
      usage,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.error("[AIRoutes] Gemini Chat API timed out after 20 seconds.");
      sendFail(res, 504, "AI chat request timed out. Please try again.");
      return;
    }
    console.error("[AIRoutes] Gemini Chat call exception:", err);
    sendFail(res, 502, "Network or system error occurred while generating the chat response.");
  }
});

// POST /api/ai/mock-interview
router.post("/mock-interview", requireAuth, async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { category, difficulty, messageHistory, isFinalTurn } = req.body;

  if (!category || !difficulty || !messageHistory || !Array.isArray(messageHistory)) {
    sendFail(res, 400, "Missing required fields: category, difficulty, or messageHistory");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendFail(res, 500, "Gemini API key is not configured");
    return;
  }

  // Determine System Prompt based on whether it is the final turn
  let systemPrompt = "";
  if (!isFinalTurn) {
    systemPrompt = `You are a Senior Technical Interviewer conducting a mock interview.
The interview category is: ${category}
The difficulty level is: ${difficulty}

You must respond in strict JSON format.
Your task is to:
1. Evaluate the user's latest answer (if they provided one) and provide brief constructive feedback.
2. Ask the NEXT interview question appropriate for the category and difficulty. If it's the very first message, just introduce yourself and ask the first question.
3. Act like a real interviewer. DO NOT reveal the correct answer before the user has answered.
4. DO NOT explain concepts, DO NOT teach, DO NOT provide tutorials, and DO NOT generate study plans. You are ONLY here to ask questions and grade the user's answer.
5. Challenge weak answers and ask follow-up questions if needed.

Output format:
{
  "feedback": "Your evaluation of the previous answer (if any, otherwise empty string).",
  "nextQuestion": "The next question you are asking the candidate."
}`;
  } else {
    systemPrompt = `You are a Senior Technical Interviewer conducting a mock interview.
The interview category is: ${category}
The difficulty level is: ${difficulty}

The interview is now COMPLETE.
You must review the entire interview transcript (message history) and provide a final comprehensive evaluation in strict JSON format.

Output format:
{
  "scores": {
    "technicalAccuracy": <number 0-10>,
    "problemSolving": <number 0-10>,
    "communication": <number 0-10>,
    "depth": <number 0-10>,
    "overall": <number 0-10>
  },
  "feedback": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "improvementSuggestions": ["suggestion 1", "suggestion 2"]
  }
}`;
  }

  // Format history for Gemini
  const contents = messageHistory.map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[AIRoutes] Gemini Mock Interview API returned error status:", response.status, errorText);
      sendFail(res, 502, "AI service provider returned an error state.");
      return;
    }

    const json = await response.json();
    const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      sendFail(res, 502, "AI service provider returned an empty response.");
      return;
    }

    // Try to parse the reply as JSON
    let parsedReply;
    try {
      parsedReply = JSON.parse(reply);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", reply);
      sendFail(res, 502, "AI returned invalid JSON format.");
      return;
    }

    sendOk(res, 200, parsedReply);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      sendFail(res, 504, "AI chat request timed out. Please try again.");
      return;
    }
    console.error("[AIRoutes] Gemini Mock Interview call exception:", err);
    sendFail(res, 502, "Network or system error occurred while generating the mock interview response.");
  }
});

export default router;
