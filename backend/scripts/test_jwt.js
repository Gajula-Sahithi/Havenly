const axios = require('axios');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: "gajula@gmail.com",
      password: "sahithi"
    });
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    const decoded = jwt.decode(token);
    console.log('Decoded Token Payload:', JSON.stringify(decoded, null, 2));
    
    const usersResponse = await axios.get('http://localhost:5000/api/admin/users-debug', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Users (first 2):', JSON.stringify(usersResponse.data.slice(0, 2), null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
