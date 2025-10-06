/**
 * Script to validate API keys and provide guidance
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('API Key Validator');
console.log('=================');

// Function to validate API key format
function validateApiKey(key, service) {
  if (!key) {
    return { valid: false, reason: 'API key not set' };
  }
  
  // Check if it's a placeholder
  if (key === `YOUR_REAL_${service.toUpperCase()}_API_KEY_HERE`) {
    return { valid: false, reason: 'Still using placeholder value' };
  }
  
  switch (service) {
  case 'grok':
    // Grok API keys should start with 'sk-or-v1-' and be quite long
    if (key.startsWith('sk-or-v1-e0b1a07')) {
      return { valid: false, reason: 'Using default placeholder key' };
    }
    if (!key.startsWith('sk-or-v1-') || key.length < 50) {
      return { valid: false, reason: 'Invalid Grok API key format' };
    }
    break;
      
  case 'gemini':
    // Gemini API keys should start with 'AIzaSy' and be 39 characters long
    if (key.startsWith('AIzaSyAvEr55')) {
      return { valid: false, reason: 'Using default placeholder key' };
    }
    if (!key.startsWith('AIzaSy') || key.length !== 39) {
      return { valid: false, reason: 'Invalid Gemini API key format' };
    }
    break;
  }
  
  return { valid: true, reason: 'API key format looks correct' };
}

// Check Grok API key
console.log('\nGrok API Key Status:');
const grokValidation = validateApiKey(process.env.GROK_API_KEY, 'grok');
console.log(`Valid: ${grokValidation.valid}`);
console.log(`Status: ${grokValidation.reason}`);
if (process.env.GROK_API_KEY) {
  console.log(`Key: ${process.env.GROK_API_KEY.substring(0, 15)}...${process.env.GROK_API_KEY.substring(process.env.GROK_API_KEY.length - 10)}`);
}

// Check Gemini API key
console.log('\nGemini API Key Status:');
const geminiValidation = validateApiKey(process.env.GEMINI_API_KEY, 'gemini');
console.log(`Valid: ${geminiValidation.valid}`);
console.log(`Status: ${geminiValidation.reason}`);
if (process.env.GEMINI_API_KEY) {
  console.log(`Key: ${process.env.GEMINI_API_KEY.substring(0, 15)}...${process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 5)}`);
}

// Provide guidance
console.log('\n' + '='.repeat(50));
if (!grokValidation.valid || !geminiValidation.valid) {
  console.log('🔧 ACTION REQUIRED:');
  
  if (!grokValidation.valid) {
    console.log('\nGrok API Key:');
    console.log('1. Visit: https://console.x.ai/');
    console.log('2. Sign up or log in to your account');
    console.log('3. Navigate to the API section');
    console.log('4. Generate a new API key');
    console.log('5. Copy the key (should start with sk-or-v1-)');
    console.log('6. Update your .env file with the real key');
  }
  
  if (!geminiValidation.valid) {
    console.log('\nGemini API Key:');
    console.log('1. Visit: https://aistudio.google.com/app/apikey');
    console.log('2. Sign in with your Google account');
    console.log('3. Create or copy your API key');
    console.log('4. Copy the key (should start with AIzaSy and be 39 characters)');
    console.log('5. Update your .env file with the real key');
  }
  
  console.log('\nAfter updating your keys, restart the server with:');
  console.log('npm run dev');
} else {
  console.log('✅ All API keys appear to be valid!');
  console.log('Your application should work correctly with AI features.');
}

console.log('\n' + '='.repeat(50));