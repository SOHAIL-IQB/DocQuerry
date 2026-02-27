const axios = require('axios');

const API_URL = 'http://localhost:5001/api/auth';
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'password123',
};

async function runTests() {
  try {
    console.log('--- Testing Registration ---');
    const regRes = await axios.post(`${API_URL}/register`, testUser);
    console.log('Register Success:', regRes.data);

    console.log('\\n--- Testing Login ---');
    const logRes = await axios.post(`${API_URL}/login`, testUser);
    console.log('Login Success:', logRes.data);

    if (regRes.data.data.token && logRes.data.data.token) {
      console.log('\\n✅ All Authentication tests passed successfully!');
    } else {
      console.log('\\n❌ Missing token in response.');
    }
  } catch (error) {
    console.error('\\n❌ Test Failed:');
    if (error.response) {
      console.error('Response Error:', error.response.data);
    } else {
      console.error('Node Error:', error.message);
    }
    process.exit(1);
  }
}

runTests();
