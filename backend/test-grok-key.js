// Test to check if Grok API key is causing issues
require('dotenv').config();

const GROK_API_KEY = process.env.GROK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('API Key Status:');
console.log('==============');
console.log('GROK_API_KEY set:', !!GROK_API_KEY);
console.log('GROK_API_KEY value:', GROK_API_KEY);
console.log('GROK_API_KEY length:', GROK_API_KEY ? GROK_API_KEY.length : 0);

console.log('\nGEMINI_API_KEY set:', !!GEMINI_API_KEY);
console.log('GEMINI_API_KEY value:', GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

// Test what would be passed to analyzeSentiment
console.log('\nSentiment analysis key selection:');
console.log('GROK_API_KEY || GEMINI_API_KEY:', GROK_API_KEY || GEMINI_API_KEY);
console.log('Is Grok key being used?', !!GROK_API_KEY);