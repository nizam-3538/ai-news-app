/**
 * Simple API key validation script
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('Simple API Key Checker');
console.log('=====================');

// Test current keys from .env
async function testCurrentKeys() {
  console.log('\nTesting current API keys from .env file:');
  
  // Test Grok API
  if (process.env.GROK_API_KEY) {
    console.log('\n1. Testing Grok API Key...');
    try {
      const response = await axios.post('https://api.x.ai/v1/chat/completions', {
        model: 'grok-beta',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 5
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Grok API key is VALID');
    } catch (error) {
      console.log('❌ Grok API key is INVALID');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        if (error.response.data) {
          console.log(`   Error: ${error.response.data.error || JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
  } else {
    console.log('\n1. Grok API Key: NOT SET');
  }
  
  // Test Gemini API
  if (process.env.GEMINI_API_KEY) {
    console.log('\n2. Testing Gemini API Key...');
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: 'Hello'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 5
          }
        },
        {
          timeout: 10000
        }
      );
      
      console.log('✅ Gemini API key is VALID');
    } catch (error) {
      console.log('❌ Gemini API key is INVALID');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        if (error.response.data) {
          console.log(`   Error: ${error.response.data.error || JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
  } else {
    console.log('\n2. Gemini API Key: NOT SET');
  }
}

// Run the test
testCurrentKeys().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('If keys are invalid, please:');
  console.log('1. Get real API keys from the respective platforms');
  console.log('2. Update your .env file with the correct keys');
  console.log('3. Restart your server');
  console.log('='.repeat(50));
});