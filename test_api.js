import fetch from 'node-fetch';

async function testEventsAPI() {
  try {
    // First, login to get token
    const loginResponse = await fetch('http://localhost:9000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@gmail.com',
        password: 'demo123', // assuming default password
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed');
      return;
    }

    const token = loginData.token;

    // Now fetch events
    const eventsResponse = await fetch('http://localhost:9000/api/community/events?status=upcoming', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const eventsData = await eventsResponse.json();
    console.log('Events response:', eventsData);

  } catch (error) {
    console.error('Error:', error);
  }
}

testEventsAPI();