const axios = require('axios');

async function checkHealth() {
  try {
    const response = await axios.get('http://localhost:3001/analyze/health');
    console.log('Health check response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error checking health:', error.message);
  }
}

checkHealth();