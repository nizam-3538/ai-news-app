/**
 * Script to test HTTPS API calls directly
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('HTTPS API Test');
console.log('==============');

// Check current API keys
console.log('Current API keys:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...${process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 5)}` : 'NOT SET');

// Test Gemini API
async function testGeminiAPI() {
  console.log('\nTesting Gemini API...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ Gemini API key not set');
    return;
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Hello, world!'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      },
      {
        timeout: 10000
      }
    );
    
    console.log('✅ Gemini API test successful');
    console.log('Response:', response.data.candidates[0].content.parts[0].text.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ Gemini API test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run tests
async function runTests() {
  await testGeminiAPI();
}

runTests();