const axios = require('axios');

async function test() {
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: "gajula@gmail.com",
      password: "sahithi"
    });
    const token = loginResponse.data.token;
    
    const usersResponse = await axios.get('http://localhost:5000/api/admin/users-debug', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let users = usersResponse.data;
    if (typeof users === 'string') {
      try {
        users = JSON.parse(users);
      } catch (e) {
        console.error('Failed to parse string response:', users.substring(0, 100));
        users = [];
      }
    }
    
    console.log('--- ALL USERS ---');
    if (Array.isArray(users)) {
      users.forEach(u => {
        console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, IDProof: ${u.idProofType || 'N/A'}, IDProofUrl: ${u.idProofUrl || 'N/A'}`);
      });
    } else {
      console.log('Not an array:', typeof users);
      console.log(users);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
