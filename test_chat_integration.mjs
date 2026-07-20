import fetch from 'node-fetch';

async function fullTest() {
  const serverUrl = 'http://localhost:5000/api';
  // const serverUrl = 'https://skill-forge-ai-server-kappa.vercel.app/api';

  try {
    // 1. Register a test user
    const email = `test_${Date.now()}@test.com`;
    console.log('Registering user:', email);
    const regRes = await fetch(`${serverUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chatbot Tester',
        email: email,
        password: 'Password123!',
      })
    });
    
    const regData = await regRes.json();
    console.log('Register response:', regRes.status, regData);
    
    if (regRes.status !== 201 && regRes.status !== 200) {
      console.error("Failed to register");
      return;
    }

    const token = regData.data?.accessToken;
    if (!token) {
      console.error("No token received");
      return;
    }

    console.log('Token acquired. Testing chatbot...');
    
    // 2. Test chatbot
    const chatRes = await fetch(`${serverUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'Hello, what can you do?',
        history: []
      })
    });
    
    const chatData = await chatRes.json();
    console.log('Chat response:', chatRes.status, JSON.stringify(chatData, null, 2));

  } catch (err) {
    console.error('Error during test:', err);
  }
}

fullTest();
