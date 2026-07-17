const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const DB_PATH = path.join(__dirname, 'db.json');

// Initialize database with seed data if it doesn't exist
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
      quizzes: {
        // Predefined skill assessments for major topics
        "html_basics": [
          {
            "id": "q1",
            "question": "Which HTML5 element is used to define major navigation blocks?",
            "options": ["<navigation>", "<nav>", "<section>", "<header>"],
            "answerIndex": 1
          },
          {
            "id": "q2",
            "question": "What is the correct HTML element for inserting a line break?",
            "options": ["<lb>", "<break>", "<br>", "<link>"],
            "answerIndex": 2
          },
          {
            "id": "q3",
            "question": "Which attribute specifies an alternate text for an image if the image cannot be displayed?",
            "options": ["title", "src", "alt", "longdesc"],
            "answerIndex": 2
          }
        ],
        "css_basics": [
          {
            "id": "q1",
            "question": "What does CSS stand for?",
            "options": ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
            "answerIndex": 1
          },
          {
            "id": "q2",
            "question": "Which CSS property controls the text size?",
            "options": ["font-style", "text-size", "font-size", "text-style"],
            "answerIndex": 2
          },
          {
            "id": "q3",
            "question": "How do you select an element with id 'demo'?",
            "options": ["#demo", ".demo", "demo", "*demo"],
            "answerIndex": 0
          }
        ],
        "js_basics": [
          {
            "id": "q1",
            "question": "Which of the following is correct about JavaScript closure?",
            "options": [
              "It is a function that has access to its outer function scope even after the outer function has returned.",
              "It is a method of closing open file streams in Node.js.",
              "It is an object constructor for private classes.",
              "It prevents memory leaks by closing variables."
            ],
            "answerIndex": 0
          },
          {
            "id": "q2",
            "question": "How do you write 'Hello World' in an alert box?",
            "options": ["msg('Hello World');", "alertBox('Hello World');", "alert('Hello World');", "msgBox('Hello World');"],
            "answerIndex": 2
          },
          {
            "id": "q3",
            "question": "Which operator is used to compare both value and type in JavaScript?",
            "options": ["==", "===", "=", "!="],
            "answerIndex": 1
          }
        ],
        "react_basics": [
          {
            "id": "q1",
            "question": "What is the purpose of the useEffect hook in React?",
            "options": [
              "To perform side effects in functional components",
              "To handle user clicks and events",
              "To create new HTML elements programmatically",
              "To style JSX tags dynamically"
            ],
            "answerIndex": 0
          },
          {
            "id": "q2",
            "question": "What are React Props?",
            "options": [
              "Internal state variables that trigger re-renders",
              "External inputs passed down to a component",
              "Reference variables to access native DOM nodes",
              "Property decorators in React classes"
            ],
            "answerIndex": 1
          },
          {
            "id": "q3",
            "question": "How do you handle a click event on a button in React?",
            "options": ["onclick={handler}", "onClick={handler}", "onClick=handler()", "clicked={handler}"],
            "answerIndex": 1
          }
        ],
        "ai_basics": [
          {
            "id": "q1",
            "question": "What is a 'Prompt' in LLMs?",
            "options": [
              "The speed at which the model generates text",
              "The input text instructions provided to guide the model's output",
              "The hidden neural layer size",
              "The cooling system threshold of the GPU cluster"
            ],
            "answerIndex": 1
          },
          {
            "id": "q2",
            "question": "What is the role of Temperature in text generation?",
            "options": [
              "It dictates the GPU's operating heat limits",
              "It controls the randomness and creativity of the output text",
              "It defines the token limit of the conversation context",
              "It represents the learning rate decay schedule"
            ],
            "answerIndex": 1
          },
          {
            "id": "q3",
            "question": "What is 'Fine-Tuning'?",
            "options": [
              "Compressing the neural network weight representations to save space",
              "Training an existing model on a specific dataset to adapt it for a particular task",
              "Adding formatting structure to the output JSON",
              "Filtering out toxic training parameters using static lists"
            ],
            "answerIndex": 1
          }
        ]
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2), 'utf8');
  }
}

initDB();

// DB Helper Functions
app.locals.readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return {};
  }
};

app.locals.writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
};

// Import Routes
const quizRouter = require('./routes/quiz');
const roadmapRouter = require('./routes/roadmap');
const copilotRouter = require('./routes/copilot');

// Set up routes
app.use('/api/quiz', quizRouter);
app.use('/api/roadmap', roadmapRouter);
app.use('/api/copilot', copilotRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Profile endpoint
app.get('/api/profile', (req, res) => {
  const db = app.locals.readDB();
  res.json(db.profiles.user_default);
});

app.post('/api/profile/update-streak', (req, res) => {
  const db = app.locals.readDB();
  const profile = db.profiles.user_default;
  
  const lastActiveDate = new Date(profile.lastActive);
  const today = new Date();
  
  // Calculate difference in days
  const diffTime = Math.abs(today - lastActiveDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    profile.streak += 1;
    if (profile.streak === 5 && !profile.badges.includes("Consistent Learner")) {
      profile.badges.push("Consistent Learner");
    }
  } else if (diffDays > 1) {
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
