const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Simulated roadmap generator template data
const ROADMAP_TEMPLATES = {
  "Frontend Developer": {
    title: "AI-Powered Frontend Developer Roadmap",
    stages: [
      {
        id: "stage_foundations",
        name: "Stage 1: Web Foundations",
        description: "Master the structure, style, and programming logic of the web canvas.",
        nodes: [
          {
            id: "html_basics",
            name: "HTML5 Essentials",
            description: "Learn page structuring, accessibility principles, and semantic layouts.",
            estimatedHours: 12,
            topics: ["Semantic tags", "Forms & Validation", "DOM structures", "SEO tags", "Accessibility standards"],
            resources: [
              { title: "MDN Web Docs: HTML basics", url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics", type: "article" },
              { title: "HTML5 Tutorial for Beginners", url: "https://www.youtube.com/watch?v=UB1O30fR-EE", type: "video" }
            ],
            project: {
              title: "Accessible Portfolio Page",
              description: "Build a highly structured, accessible personal profile page using semantic tags."
            }
          },
          {
            id: "css_basics",
            name: "CSS Grid & Flexbox",
            description: "Master layout architectures, responsive properties, and visual design rules.",
            estimatedHours: 18,
            topics: ["Flexbox alignments", "CSS Grid template areas", "Media queries", "CSS variables", "Transitions"],
            resources: [
              { title: "CSS-Tricks: A Complete Guide to Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", type: "article" },
              { title: "Flexbox Froggy - Learn CSS layout", url: "https://flexboxfroggy.com/", type: "course" }
            ],
            project: {
              title: "Product Grid Dashboard",
              description: "Create a modern responsive product overview page with filtering grid items."
            }
          }
        ]
      },
      {
        id: "stage_js",
        name: "Stage 2: Core Programming",
        description: "Program dynamic browser events and manage state operations.",
        nodes: [
          {
            id: "js_basics",
            name: "JavaScript Core Logic",
            description: "Master functions, closures, scoping, array transformations, and array methods.",
            estimatedHours: 25,
            topics: ["Closures", "Scopes", "Promises & async/await", "Array methods (map, filter, reduce)", "ES6 classes"],
            resources: [
              { title: "JavaScript.info - Core JS", url: "https://javascript.info/", type: "article" },
              { title: "JavaScript Essentials Course", url: "https://www.youtube.com/watch?v=PkZNo7MFNFg", type: "video" }
            ],
            project: {
              title: "Dynamic Task Orchestrator",
              description: "Build a complex, stateful todo checklist engine using pure JavaScript and LocalStorage."
            }
          }
        ]
      },
      {
        id: "stage_frameworks",
        name: "Stage 3: Component Frameworks",
        description: "Scale applications using React component trees and build systems.",
        nodes: [
          {
            id: "react_basics",
            name: "React Component Engine",
            description: "Build reusable elements, hooks, global states, and virtual DOM strategies.",
            estimatedHours: 30,
            topics: ["JSX", "useState & useEffect hooks", "Context API", "Custom Hooks", "React rendering cycle"],
            resources: [
              { title: "React Dev Documentation", url: "https://react.dev/", type: "article" },
              { title: "Learn React In 30 Minutes", url: "https://www.youtube.com/watch?v=hQAHJsKywFw", type: "video" }
            ],
            project: {
              title: "AI Prompt Manager UI",
              description: "Create an interactive interface to store, edit, and categorize custom AI prompt configurations."
            }
          }
        ]
      }
    ]
  },
  "Backend Developer": {
    title: "AI-Powered Backend Developer Roadmap",
    stages: [
      {
        id: "stage_server_foundations",
        name: "Stage 1: Scripting & Version Control",
        description: "Set up the code versioning pipeline and script core logic.",
        nodes: [
          {
            id: "git_versioning",
            name: "Git & Github Workflows",
            description: "Control codebase modifications, collaborate with pull requests, and manage branches.",
            estimatedHours: 10,
            topics: ["Git log & checkout", "Branch rebasing", "Merge conflicts", "Forking workflows", "Git tagging"],
            resources: [
              { title: "Github Git Handbook", url: "https://guides.github.com/introduction/git-handbook/", type: "article" },
              { title: "Git & GitHub Crash Course", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", type: "video" }
            ],
            project: {
              title: "Collaborative Repository Setup",
              description: "Create a Github repository, configure branch protection rules, and simulate a pull-request conflict resolution."
            }
          },
          {
            id: "js_basics",
            name: "JavaScript Node.js Basics",
            description: "Write asynchronous server-side scripts using JavaScript.",
            estimatedHours: 20,
            topics: ["Node Event Loop", "NPM ecosystem", "fs module", "Path resolution", "ES Modules vs CommonJS"],
            resources: [
              { title: "Node.js official guides", url: "https://nodejs.org/en/docs/guides/", type: "article" },
              { title: "Node.js Tutorial for Beginners", url: "https://www.youtube.com/watch?v=TbQeW382348", type: "video" }
            ],
            project: {
              title: "Log Parsing CLI script",
              description: "Develop a CLI script that reads a 100MB log file, parses entries, and exports CSV metrics."
            }
          }
        ]
      },
      {
        id: "stage_apis",
        name: "Stage 2: Web Server Routers",
        description: "Build robust REST APIs with authentication and security middleware.",
        nodes: [
          {
            id: "express_basics",
            name: "Express.js API Design",
            description: "Route requests, apply CORS, validate schemas, and write response headers.",
            estimatedHours: 25,
            topics: ["CORS Configuration", "JSON Body Parsing", "Route parameters", "Error-handling middleware", "Express Router"],
            resources: [
              { title: "Express.js Official Guide", url: "https://expressjs.com/", type: "article" },
              { title: "Express.js API Course", url: "https://www.youtube.com/watch?v=lY6icfhap2o", type: "video" }
            ],
            project: {
              title: "User Profile Rest API",
              description: "Build an API offering full CRUD operations, query parameter filtering, and structured JSON responses."
            }
          }
        ]
      }
    ]
  },
  "AI Engineer": {
    title: "AI-Powered AI Engineer Roadmap",
    stages: [
      {
        id: "stage_ai_foundations",
        name: "Stage 1: AI Prompting & Core APIs",
        description: "Connect to Large Language Models and design specialized instruction templates.",
        nodes: [
          {
            id: "ai_basics",
            name: "AI Prompt Engineering",
            description: "Understand temperature, system instructions, dynamic parameters, and zero-shot vs few-shot paradigms.",
            estimatedHours: 15,
            topics: ["System Instructions", "Few-Shot Examples", "Context window constraints", "JSON Schema enforcement", "Temperature tuning"],
            resources: [
              { title: "Google Prompting Guide", url: "https://ai.google.dev/gemini-api/docs/prompting", type: "article" },
              { title: "ChatGPT Prompt Engineering for Developers", url: "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/", type: "course" }
            ],
            project: {
              title: "Structured Output Prompt Harness",
              description: "Design a prompt system that reliably extracts JSON metadata from unformatted text documents."
            }
          }
        ]
      },
      {
        id: "stage_embeddings",
        name: "Stage 2: Vector Search & RAG",
        description: "Give AI systems long-term memory by injecting semantic documentation searches.",
        nodes: [
          {
            id: "rag_vector_db",
            name: "Retrieval-Augmented Generation (RAG)",
            description: "Process document chunks, calculate embeddings, store vectors, and fetch semantically relevant inputs.",
            estimatedHours: 25,
            topics: ["Document Chunking", "Text Embeddings", "Vector Similarity (Cosine)", "Pinecone / Chroma DB", "Context Injection"],
            resources: [
              { title: "Introduction to RAG", url: "https://www.deeplearning.ai/short-courses/retrieval-augmented-generation-for-production/", type: "course" },
              { title: "Pinecone Vector Search learning hub", url: "https://www.pinecone.io/learn/", type: "article" }
            ],
            project: {
              title: "PDF Knowledge Chat Assistant",
              description: "Build a prototype that embeds PDF pages, indexes them, and queries Gemini injecting relevant context chunks."
            }
          }
        ]
      }
    ]
  }
};

// Default template for DevOps / unknown
ROADMAP_TEMPLATES["DevOps Engineer"] = {
  title: "AI-Powered DevOps Engineer Roadmap",
  stages: [
    {
      id: "stage_infra",
      name: "Stage 1: Environments & Automation",
      description: "Set up container engines and deploy automated systems.",
      nodes: [
        {
          id: "docker_containers",
          name: "Docker Containerization",
          description: "Package code and execution dependencies inside portable lightweight containers.",
          estimatedHours: 18,
          topics: ["Dockerfile instructions", "Image caching", "Port mapping", "Docker Compose volumes", "Multi-stage builds"],
          resources: [
            { title: "Docker Getting Started Guide", url: "https://docs.docker.com/get-started/", type: "article" },
            { title: "Docker tutorial video", url: "https://www.youtube.com/watch?v=3c-iKanqeec", type: "video" }
          ],
          project: {
            title: "Multi-service compose stack",
            description: "Dockerize a Next.js front-end and Node.js backend to communicate inside a custom Docker bridge network."
          }
        }
      ]
    }
  ]
};

// GET /api/roadmap/:id
router.get('/:id', (req, res) => {
  const db = req.app.locals.readDB();
  const roadmap = db.roadmaps[req.params.id];
  
  if (!roadmap) {
    return res.status(404).json({ error: "Roadmap not found." });
  }
  
  res.json(roadmap);
});

// POST /api/roadmap/generate
router.post('/generate', async (req, res) => {
  const { career, level, style, hoursPerWeek, goal } = req.body;
  
  if (!career) {
    return res.status(400).json({ error: "career field is required." });
  }

  const db = req.app.locals.readDB();
  const apiKey = process.env.GEMINI_API_KEY;
  let generatedRoadmap = null;

  // Let's create a unique ID for this roadmap
  const roadmapId = crypto.randomBytes(8).toString('hex');
  const creationDate = new Date().toISOString();

  // Try real Gemini API call if key is provided
  if (apiKey) {
    try {
      const prompt = `
Generate a highly structured, sequential career and learning roadmap for: ${career}.
Student context:
- Skill level: ${level || 'Beginner'}
- Learning style preference: ${style || 'Practical'}
- Time commitment: ${hoursPerWeek || 10} hours per week
- Personal target goal: ${goal || 'General learning'}

You MUST return a JSON object ONLY, conforming EXACTLY to the following structure. Do not wrap in markdown quotes:
{
  "title": "AI-Powered ${career} Roadmap",
  "estimatedWeeks": 12,
  "stages": [
    {
      "id": "stage_unique_id",
      "name": "Stage 1: Name",
      "description": "Short summary of what this stage teaches.",
      "nodes": [
        {
          "id": "node_unique_id",
          "name": "Topic Name",
          "description": "Explanations of this topic.",
          "estimatedHours": 10,
          "topics": ["Sub-topic 1", "Sub-topic 2"],
          "resources": [
            { "title": "Resource title", "url": "https://example.com/link", "type": "article" }
          ],
          "project": {
            "title": "Mini Project Title",
            "description": "A description of what to build to prove mastery."
          }
        }
      ]
    }
  ]
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const responseText = json.candidates[0].content.parts[0].text;
        generatedRoadmap = JSON.parse(responseText);
      } else {
        console.warn("Gemini API returned error state. Falling back to simulation engine.");
      }
    } catch (apiError) {
      console.error("Gemini API call failed:", apiError);
      // Fallback
    }
  }

  // Fallback to Simulation Engine if no AI response
  if (!generatedRoadmap) {
    // Select closest template
    const templateName = Object.keys(ROADMAP_TEMPLATES).find(k => 
      career.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(career.toLowerCase())
    ) || "Frontend Developer";

    const baseTemplate = ROADMAP_TEMPLATES[templateName];

    // Compute custom values based on user profiles
    const totalHours = baseTemplate.stages.reduce((acc, stage) => 
      acc + stage.nodes.reduce((nAcc, node) => nAcc + node.estimatedHours, 0), 0
    );

    const commitment = parseInt(hoursPerWeek) || 10;
    const computedWeeks = Math.ceil(totalHours / commitment);

    // Deep clone the template
    generatedRoadmap = JSON.parse(JSON.stringify(baseTemplate));
    generatedRoadmap.estimatedWeeks = computedWeeks;
    generatedRoadmap.title = `AI-Customized ${career} Roadmap`;
    
    // Modify description based on learning style
    generatedRoadmap.stages.forEach((stage, sIdx) => {
      stage.nodes.forEach((node, nIdx) => {
        if (style === 'Theoretical') {
          node.resources.unshift({
            title: `Deep-Dive Academic Guide on ${node.name}`,
            url: "https://arxiv.org/",
            type: "article"
          });
        }
        // Incorporate custom goals
        if (goal && nIdx === 0 && sIdx === 0) {
          node.description += ` Specifically tailored for your goal: "${goal}".`;
        }
      });
    });
  }

  // Add additional metadata
  generatedRoadmap.id = roadmapId;
  generatedRoadmap.career = career;
  generatedRoadmap.level = level || 'Beginner';
  generatedRoadmap.style = style || 'Practical';
  generatedRoadmap.hoursPerWeek = hoursPerWeek || 10;
  generatedRoadmap.goal = goal || '';
  generatedRoadmap.createdAt = creationDate;
  generatedRoadmap.completedNodes = [];

  // Save to DB
  db.roadmaps[roadmapId] = generatedRoadmap;
  appCurrentActive = roadmapId; // Cache active roadmap ID
  
  // Update user profile active roadmap list
  db.profiles.user_default.activeRoadmapId = roadmapId;
  req.app.locals.writeDB(db);

  res.json(generatedRoadmap);
});

// POST /api/roadmap/:id/toggle-node
router.post('/:id/toggle-node', (req, res) => {
  const { id } = req.params;
  const { nodeId, completed } = req.body;

  const db = req.app.locals.readDB();
  const roadmap = db.roadmaps[id];

  if (!roadmap) {
    return res.status(404).json({ error: "Roadmap not found." });
  }

  if (!roadmap.completedNodes) {
    roadmap.completedNodes = [];
  }

  const index = roadmap.completedNodes.indexOf(nodeId);
  if (completed && index === -1) {
    roadmap.completedNodes.push(nodeId);
  } else if (!completed && index !== -1) {
    roadmap.completedNodes.splice(index, 1);
  }

  // Sync profile completed list
  const profile = db.profiles.user_default;
  if (!profile.completedNodes) {
    profile.completedNodes = [];
  }

  const pIndex = profile.completedNodes.indexOf(nodeId);
  if (completed && pIndex === -1) {
    profile.completedNodes.push(nodeId);
  } else if (!completed && pIndex !== -1) {
    profile.completedNodes.splice(pIndex, 1);
  }

  db.roadmaps[id] = roadmap;
  db.profiles.user_default = profile;
  req.app.locals.writeDB(db);

  // Recalculate percent completion
  let totalNodes = 0;
  roadmap.stages.forEach(s => totalNodes += s.nodes.length);
  const completionPercentage = totalNodes > 0 ? Math.round((roadmap.completedNodes.length / totalNodes) * 100) : 0;

  res.json({
    completedNodes: roadmap.completedNodes,
    completionPercentage,
    totalNodes
  });
});

module.exports = router;
