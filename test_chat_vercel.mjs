import fetch from 'node-fetch';

async function testChat() {
  try {
    const res = await fetch('https://skill-forge-ai-server-kappa.vercel.app/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        history: []
      })
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testChat();
