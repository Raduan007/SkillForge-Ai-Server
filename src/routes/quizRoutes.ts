import { Router, Request, Response } from "express";

const router = Router();

// 10 Onboarding career match questions
const CAREER_QUESTIONS = [
  {
    id: "q1",
    question: "What type of problem sounds most rewarding to solve?",
    options: [
      { text: "Designing elegant layout systems, animations, and typography.", career: "Frontend Developer" },
      { text: "Optimizing database queries, microservice communication, and caching.", career: "Backend Developer" },
      { text: "Training model neural networks, processing natural language, and computer vision.", career: "AI Engineer" },
      { text: "Writing CI/CD build scripts, autoscaling Kubernetes clusters, and monitoring uptime.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q2",
    question: "Which technology stack elements interest you the most?",
    options: [
      { text: "React, CSS variables, CSS transitions, Tailwind, Canvas API.", career: "Frontend Developer" },
      { text: "Node.js, PostgreSQL, Redis, REST/GraphQL APIs, OAuth2.", career: "Backend Developer" },
      { text: "Python, PyTorch, Transformers, OpenAI/Gemini SDKs, Vector Databases.", career: "AI Engineer" },
      { text: "Docker, Terraform, AWS, Github Actions, Prometheus.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q3",
    question: "How do you prefer to spend your project development time?",
    options: [
      { text: "Fine-tuning pixels, checking accessibility (a11y), and responsive mobile views.", career: "Frontend Developer" },
      { text: "Designing data models, scaling connections, and organizing application logic.", career: "Backend Developer" },
      { text: "Experimenting with prompts, fine-tuning model parameters, and vectorizing content.", career: "AI Engineer" },
      { text: "Setting up build pipelines, server environments, and script automation.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q4",
    question: "Which of the following sounds like a fun weekend hackathon project?",
    options: [
      { text: "A rich, collaborative 3D whiteboard app in the browser.", career: "Frontend Developer" },
      { text: "A custom real-time messaging queue backend that handles 10k req/s.", career: "Backend Developer" },
      { text: "An intelligent study bot that creates practice exams from uploaded textbooks.", career: "AI Engineer" },
      { text: "A zero-downtime, multi-region container deployment system.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q5",
    question: "When an application is slow, where do you look first?",
    options: [
      { text: "DOM re-renders, layout shifts, image sizes, and JS bundle size.", career: "Frontend Developer" },
      { text: "Slow SQL queries, missing indexes, memory leaks, or synchronous blocking calls.", career: "Backend Developer" },
      { text: "Model inference latency, token counts, temperature settings, and API rate limits.", career: "AI Engineer" },
      { text: "Server CPU throttling, container memory limits, network bottlenecks, or load balancer overload.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q6",
    question: "Which book title would you pick off a shelf?",
    options: [
      { text: "CSS Grid & The Art of Visual Web Design", career: "Frontend Developer" },
      { text: "Designing Data-Intensive Applications", career: "Backend Developer" },
      { text: "Deep Learning with Python", career: "AI Engineer" },
      { text: "The Phoenix Project: DevOps & IT Success", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q7",
    question: "Which programming language feels closest to your heart or interests?",
    options: [
      { text: "TypeScript / JavaScript (Web standards)", career: "Frontend Developer" },
      { text: "Go, Rust, Java, or Node.js (High throughput)", career: "Backend Developer" },
      { text: "Python (Data analysis, scientific computing)", career: "AI Engineer" },
      { text: "Bash, YAML, Go (Infrastructure scripting)", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q8",
    question: "What is your philosophy on 'writing documentation'?",
    options: [
      { text: "I like component style guides, design system storybooks, and visual examples.", career: "Frontend Developer" },
      { text: "I like detailed API blueprints, database schemas, and request/response models.", career: "Backend Developer" },
      { text: "I like documenting prompt instructions, context sizes, and model evaluation benchmarks.", career: "AI Engineer" },
      { text: "I like runbooks, network topology charts, and disaster recovery processes.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q9",
    question: "What is the most frustrating type of bug for you?",
    options: [
      { text: "A button text shifting slightly out of bounds on older Safari versions.", career: "Frontend Developer" },
      { text: "A database transaction failing silently under race conditions.", career: "Backend Developer" },
      { text: "The model hallucinating fake urls or returning garbage JSON structure.", career: "AI Engineer" },
      { text: "A build pipeline failing because of a minor version mismatch in an OS library.", career: "DevOps Engineer" }
    ]
  },
  {
    id: "q10",
    question: "What is your preferred project workflow?",
    options: [
      { text: "Iterative prototyping directly based on interactive design mockups.", career: "Frontend Developer" },
      { text: "Defining API contracts and entity relationships before writing business logic.", career: "Backend Developer" },
      { text: "Feeding datasets to model structures and validating performance changes.", career: "AI Engineer" },
      { text: "Continuous integrations: merging to main branches and watching servers deploy.", career: "DevOps Engineer" }
    ]
  }
];

function getCareerDescription(career: string): string {
  switch (career) {
    case "Frontend Developer":
      return "Build interactive, high-performance visual interfaces and components in web browsers.";
    case "Backend Developer":
      return "Design database layouts, write REST/GraphQL routes, configure cache, and scale endpoints.";
    case "AI Engineer":
      return "Deploy machine learning pipelines, fine-tune models, and manage generative prompt systems.";
    case "DevOps Engineer":
      return "Orchestrate build scripts, continuous integration builds, and monitor microservice nodes.";
    default:
      return "Explore tech sectors and find the perfect path.";
  }
}

// GET /api/quiz/career-match
router.get("/career-match", (req: Request, res: Response) => {
  res.json(CAREER_QUESTIONS);
});

// POST /api/quiz/career-match/submit
router.post("/career-match/submit", (req: Request, res: Response) => {
  const { answers } = req.body;
  if (!answers || typeof answers !== "object") {
    res.status(400).json({ error: "Invalid answers structure. Ex: {q1: 0, q2: 2}" });
    return;
  }

  const scoreMap: Record<string, number> = {
    "Frontend Developer": 0,
    "Backend Developer": 0,
    "AI Engineer": 0,
    "DevOps Engineer": 0,
  };

  let totalAnswered = 0;

  CAREER_QUESTIONS.forEach((q) => {
    const selectedOptionIndex = answers[q.id];
    if (selectedOptionIndex !== undefined && q.options[selectedOptionIndex]) {
      const career = q.options[selectedOptionIndex].career;
      scoreMap[career] = (scoreMap[career] || 0) + 1;
      totalAnswered++;
    }
  });

  if (totalAnswered === 0) {
    res.status(400).json({ error: "No answers matched. Please answer at least one question." });
    return;
  }

  const recommendations = Object.keys(scoreMap)
    .map((career) => {
      const rawScore = scoreMap[career];
      const percentage = Math.round((rawScore / totalAnswered) * 100);
      return {
        career,
        matchPercentage: percentage,
        description: getCareerDescription(career),
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  // Update profile recommendations
  const db = req.app.locals.readDB();
  db.profiles.user_default.recommendedCareers = recommendations;
  req.app.locals.writeDB(db);

  res.json({ recommendations });
});

// GET /api/quiz/node/:nodeId
router.get("/node/:nodeId", (req: Request, res: Response) => {
  const db = req.app.locals.readDB();
  const nodeId = req.params.nodeId as string;

  let quiz = db.quizzes[nodeId];
  if (!quiz) {
    const cleanNodeName = nodeId
      .split("_")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    quiz = [
      {
        id: "dq1",
        question: `Which of the following best describes the core concept of ${cleanNodeName}?`,
        options: [
          `It is a structured design pattern used to optimize resources.`,
          `It is an outdated protocol replaced by server-side templates.`,
          `It is a styling property meant to control layout dimensions.`,
          `It is a compiler flag meant to run scripts faster.`,
        ],
        answerIndex: 0,
      },
      {
        id: "dq2",
        question: `When implementing ${cleanNodeName}, what is a common best practice?`,
        options: [
          "Hardcoding variable values directly into deployment setups",
          "Separating concerns, using modular structure, and writing clean documentation",
          "Bypassing git version control checks to save compile time",
          "Using global scope variables to share state across components",
        ],
        answerIndex: 1,
      },
      {
        id: "dq3",
        question: `What is a potential trade-off or pitfall when using ${cleanNodeName}?`,
        options: [
          "It makes code completely unreadable to other developers",
          "Increased initial configuration complexity and learning curve",
          "It prevents page files from loading altogether in modern setups",
          "It requires constant network connection to execute styling operations",
        ],
        answerIndex: 1,
      },
    ];
  }

  res.json(quiz);
});

export default router;
