import fetch from 'node-fetch';

async function testChat() {
  try {
    const res = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Missing Authorization header intentionally, we'll see if we get 401
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
