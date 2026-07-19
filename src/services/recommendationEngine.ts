import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import Roadmap from "../models/Roadmap.js";

export interface RecommendationResult {
  nextSkill: string;
  nextRoadmapTitle: string;
  suggestedProject: {
    title: string;
    description: string;
  };
  studyPlan: string[]; // 7 elements mapping Day 1 to Day 7
}

export class RecommendationEngine {
  /**
   * Generates personalized recommendations and a 7-day study plan.
   */
  static async generate(userId: string): Promise<RecommendationResult> {
    try {
      const enrollments = await Enrollment.find({ userId, status: "active" })
        .populate("roadmapId")
        .sort({ progress: -1 }); // prioritize roadmap with highest progress

      const progressRecords = await Progress.find({ userId });

      let nextSkill = "Initialize your first roadmap";
      let nextRoadmapTitle = "Explore Roadmaps";
      let activeCategory = "General";
      let remainingSkillsToStudy: string[] = [];

      if (enrollments.length > 0) {
        // Find the first active incomplete roadmap
        let activePath: any = null;
        let activeProgressRec: any = null;

        for (const e of enrollments) {
          const roadmap = e.roadmapId as any;
          if (!roadmap) continue;

          const progress = progressRecords.find((p: any) => p.roadmapId.toString() === roadmap._id.toString());
          const completedNodes = progress?.completedNodes || [];

          // Find uncompleted skills in this roadmap
          const uncompleted = (roadmap.skills || []).filter((s: string) => !completedNodes.includes(s));
          if (uncompleted.length > 0) {
            activePath = roadmap;
            activeProgressRec = progress;
            remainingSkillsToStudy = uncompleted;
            break;
          }
        }

        if (activePath) {
          nextRoadmapTitle = activePath.title;
          activeCategory = activePath.category || "General";
          nextSkill = remainingSkillsToStudy[0];
        }
      }

      // Generate suggested portfolio project matching active career category
      let suggestedProject = {
        title: "Personal Developer Portfolio Website",
        description: "Build a responsive portfolio page showcasing your study pathways, streak milestones, and live project demonstrations using HTML, CSS, and vanilla JS."
      };

      if (activeCategory.toLowerCase().includes("frontend")) {
        suggestedProject = {
          title: "Collaborative Kanban Task Board",
          description: "Design an interactive task management board with drag-and-drop column sorting, local storage synchronization, state filters, and Tailwind design details."
        };
      } else if (activeCategory.toLowerCase().includes("backend")) {
        suggestedProject = {
          title: "JWT Authorization Gatekeeper API",
          description: "Develop a secure RESTful Node/Express server featuring session login routes, access/refresh token generation, hashing algorithms, and request logs."
        };
      } else if (activeCategory.toLowerCase().includes("data science") || activeCategory.toLowerCase().includes("ai")) {
        suggestedProject = {
          title: "Sales Trends Regression Predictor",
          description: "Construct a Python analysis notebook using Pandas to clean historical transaction records, plotting visualizations and training a Scikit-Learn linear regression model."
        };
      } else if (activeCategory.toLowerCase().includes("design")) {
        suggestedProject = {
          title: "Interactive E-Commerce Checkout Figma Prototype",
          description: "Wireframe a streamlined checkout layout flow, establishing component style guides, unified typography assets, micro-interaction state transitions, and user test paths."
        };
      }

      // Generate 7-Day Study Plan
      const studyPlan: string[] = [];
      let skillIndex = 0;

      for (let i = 1; i <= 7; i++) {
        if (skillIndex < remainingSkillsToStudy.length) {
          studyPlan.push(`Day ${i}: Study and practice the skill "${remainingSkillsToStudy[skillIndex]}" from the "${nextRoadmapTitle}" path.`);
          skillIndex++;
        } else {
          // Fallback fillers if remaining active skills are exhausted
          if (i === 1) {
            studyPlan.push(`Day ${i}: Explore and enroll in a new career learning pathway on the SkillForge explore catalog.`);
          } else if (i === 2) {
            studyPlan.push(`Day ${i}: Draft a structural outline for your portfolio project: "${suggestedProject.title}".`);
          } else if (i === 3) {
            studyPlan.push(`Day ${i}: Refactor and format code from your previously completed learning modules to improve styling.`);
          } else if (i === 4) {
            studyPlan.push(`Day ${i}: Attempt code exercises or take a technical mock interview quiz challenge to verify retention.`);
          } else if (i === 5) {
            studyPlan.push(`Day ${i}: Add documentation and a comprehensive README.md file to your active GitHub code repositories.`);
          } else if (i === 6) {
            studyPlan.push(`Day ${i}: Pair program with a peer or research industry articles regarding modern trends in ${activeCategory}.`);
          } else {
            studyPlan.push(`Day ${i}: Conduct a weekly reflection of the concepts you studied, and schedule your goals for next week.`);
          }
        }
      }

      return {
        nextSkill,
        nextRoadmapTitle,
        suggestedProject,
        studyPlan
      };
    } catch (err) {
      console.error("[RecommendationEngine] Error generating recommendations:", err);
      return {
        nextSkill: "Master your active lessons",
        nextRoadmapTitle: "Active Roadmap",
        suggestedProject: {
          title: "Personal Portfolio Webpage",
          description: "Construct a portfolio page showcasing your certifications and active skills."
        },
        studyPlan: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}: Study and review your active roadmap milestones.`)
      };
    }
  }
}
