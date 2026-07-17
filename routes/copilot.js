const express = require('express');
const router = express.Router();

// Simulated AI Copilot answers based on keyword triggers
const SIMULATED_RESPONSES = [
  {
    keywords: ["closure", "lexical", "scope"],
    reply: `### JavaScript Closures Explained 🚀

A **closure** is the combination of a function bundled together (enclosed) with references to its surrounding state (the **lexical environment**). In other words, a closure gives an inner function access to the outer function's scope even after the outer function has returned.

#### Code Example
\`\`\`javascript
function createCounter() {
  let count = 0; // Private variable in lexical scope
  
  return {
    increment: function() {
      count++;
      return count;
    },
    decrement: function() {
      count--;
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.count); // undefined (it is private!)
\`\`\`

#### Key Takeaway
Use closures to emulate **private variables** or maintain state inside callbacks and asynchronous handlers.`
  },
  {
    keywords: ["grid", "flexbox", "layout", "css"],
    reply: `### Flexbox vs. CSS Grid 🎨

Choosing between Flexbox and Grid depends on your layout requirements:

1. **Flexbox (One-Dimensional)**
   - Best for layouts in a single row *or* column.
   - Ideal for navigation headers, button groupings, and content alignment inside cards.
   - Use properties like \`justify-content\` and \`align-items\`.

2. **CSS Grid (Two-Dimensional)**
   - Best for complex layouts in *both* columns and rows simultaneously.
   - Ideal for entire page layouts, photo galleries, or nested dashboard panels.
   - Use properties like \`grid-template-columns: repeat(3, 1fr)\` and \`gap\`.

#### Recommendation
Use **Grid** for the macro-layout of your webpage, and nested **Flexbox** for aligning the micro-elements within your grid columns.`
  },
  {
    keywords: ["project", "idea", "build"],
    reply: `### Recommended Portfolio Projects 🛠️

To reinforce your skills for this node, try building one of these projects:

1. **The Prompt Vault**
   - *Description*: A web dashboard to draft, search, and copy prompt instructions with variables.
   - *Stack*: React + LocalStorage.
   - *Bonus*: Implement dynamic categorization and tags.

2. **Server Health Monitor CLI**
   - *Description*: A script that polls API endpoint URLs and writes status logs.
   - *Stack*: Node.js + FileSystem API.
   - *Bonus*: Set up custom email notifications when servers go offline.

3. **Contextual Document search**
   - *Description*: Read text files, compute a basic key-phrase indexing model, and search.
   - *Stack*: Python or Node.js.

Which one of these matches your learning speed? Let me know and I can write a step-by-step layout structure for you!`
  },
  {
    keywords: ["interview", "question", "quiz"],
    reply: `### Mock Technical Interview Prep 🎤

Here are some typical interview questions regarding the current stage:

1. *\"What is the difference between client-side rendering (CSR) and server-side rendering (SSR) in Next.js?\"*
   - **Answer outline**: CSR downloads an empty HTML skeleton and compiles JavaScript on the browser. SSR renders the complete HTML string on the server for each client request, improving initial page load time and search engine index visibility.

2. *\"Explain what 'Idempotence' means in REST APIs.\"*
   - **Answer outline**: An API operation is idempotent if calling it multiple times yields the same resource state. GET, PUT, and DELETE are idempotent; POST is typically not.

3. *\"What is prompt hijacking and how do you protect against it?\"*
   - **Answer outline**: An attack where a user inputs command instructions that overwrite the system prompts. Protect by enforcing XML/JSON tag delimiters and using strict system instructions.`
  }
];

// Default responses if no keywords match
const DEFAULT_SIMULATED_REPLIES = [
  "That is a great question! In career development, practicing this topic with practical projects is the best way to gain muscle memory. Would you like me to write a small coding exercise for this?",
  "I am analyzing your roadmap progress. This topic is key to unlocking the next stage. Try setting up a blank project files workspace on your local computer to experiment with it.",
  "Excellent query. Understanding this parameter gives you a major advantage in technical interviews. Let me know if you would like a brief explanation of how it is used in real production applications.",
  "To master this, try writing down a brief summary in your own words, or let's do a mock question challenge. Type 'interview question' to get started!"
];

// POST /api/copilot/chat
router.post('/chat', async (req, res) => {
  const { message, currentNodeId, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message content is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const chatHistoryPrompt = history && history.length > 0 
        ? history.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.content}`).join('\n')
        : "";

      const prompt = `
You are a friendly, encouraging AI Career Co-Pilot and Tutor inside the SkillForge AI platform.
Your goal is to guide the user on their learning journey, write clear explanations, suggest code samples, and provide career advice.
Current user progress context: The user is currently studying the roadmap node: ${currentNodeId || 'General Career Goals'}.

Conversation history:
${chatHistoryPrompt}
User: ${message}
AI:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const reply = json.candidates[0].content.parts[0].text;
        return res.json({ reply });
      } else {
        console.warn("Gemini chat API returned error state. Falling back to simulation engine.");
      }
    } catch (apiError) {
      console.error("Gemini chat API call failed:", apiError);
    }
  }

  // Fallback Simulation Engine
  const userMessageLower = message.toLowerCase();
  let matchedReply = null;

  for (const item of SIMULATED_RESPONSES) {
    if (item.keywords.some(kw => userMessageLower.includes(kw))) {
      matchedReply = item.reply;
      break;
    }
  }

  if (!matchedReply) {
    // Select random generic reply
    const index = Math.floor(Math.random() * DEFAULT_SIMULATED_REPLIES.length);
    matchedReply = DEFAULT_SIMULATED_REPLIES[index];
  }

  // Simulate thinking delay (client can handle loading states, we return immediately)
  res.json({ reply: matchedReply });
});

module.exports = router;
