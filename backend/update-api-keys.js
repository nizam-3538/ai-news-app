/**
 * Script to help users update their API keys properly
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('API Key Update Helper');
console.log('====================');

// Check current API keys
console.log('Current API keys in .env file:');
console.log('GROK_API_KEY:', process.env.GROK_API_KEY || 'NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY || 'NOT SET');

// Show if keys are detected as placeholders
if (process.env.GROK_API_KEY) {
  const isGrokPlaceholder = process.env.GROK_API_KEY === 'YOUR_REAL_GROK_API_KEY_HERE' || 
                           process.env.GROK_API_KEY.startsWith('sk-or-v1-e0b1a07') ||
                           process.env.GROK_API_KEY.length <= 32;
  console.log('GROK_API_KEY detected as placeholder:', isGrokPlaceholder);
}

if (process.env.GEMINI_API_KEY) {
  const isGeminiPlaceholder = process.env.GEMINI_API_KEY === 'YOUR_REAL_GOOGLE_GEMINI_API_KEY_HERE' || 
                             process.env.GEMINI_API_KEY.startsWith('AIzaSyAvEr55') ||
                             process.env.GEMINI_API_KEY.length <= 39;
  console.log('GEMINI_API_KEY detected as placeholder:', isGeminiPlaceholder);
}

console.log('\nTo update your API keys:');
console.log('1. Get your Grok API key from: https://console.x.ai/');
console.log('2. Get your Gemini API key from: https://aistudio.google.com/app/apikey');
console.log('3. Update the .env file manually with your real API keys');
console.log('4. Restart the server');

console.log('\nExample of what your .env file should contain:');
console.log('# Google Gemini AI Configuration');
console.log('GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY_HERE');
console.log('# Grok API Configuration');
console.log('GROK_API_KEY=YOUR_REAL_GROK_API_KEY_HERE');

console.log('\nAfter updating your keys, restart the server with:');
console.log('npm run dev');