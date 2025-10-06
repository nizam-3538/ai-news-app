/**
 * Test script to check Gemini API connectivity
 */

require('dotenv').config();
const { testGeminiAPI } = require('./lib/ai');

async function runTest() {
  console.log('🧪 Starting Gemini API Test...\n');
  
  const result = await testGeminiAPI();
  
  console.log('\n=== Test Results ===');
  if (result.success) {
    console.log('✅ Gemini API is working correctly!');
    console.log('Model:', result.result.model);
  } else {
    console.log('❌ Gemini API test failed!');
    console.log('Error:', result.error);
  }
}

// Run the test
runTest().catch(console.error);