import 'dotenv/config';
import fetch from 'node-fetch';

async function testGemini35Flash() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hello" }] }],
          systemInstruction: {
            parts: [{ text: "You are a test." }]
          },
        })
      }
    );
    console.log('Status:', response.status);
    console.log('Body:', await response.text());
  } catch (err) {
    console.error('Error:', err);
  }
}
testGemini35Flash();
