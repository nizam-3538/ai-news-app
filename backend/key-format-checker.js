/**
 * Script to check if API keys are properly formatted
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('🔑 API Key Format Checker');
console.log('========================');

function checkGrokKey(key) {
  console.log('\n🔍 Checking Grok API Key Format:');
  
  if (!key) {
    console.log('❌ No Grok API key found');
    return false;
  }
  
  console.log(`Key length: ${key.length} characters`);
  
  // Check for placeholder patterns
  if (key.includes('YOUR_REAL') || key.includes('PLACEHOLDER')) {
    console.log('❌ Key contains placeholder text');
    return false;
  }
  
  if (key.startsWith('sk-or-v1-e0b1a07')) {
    console.log('❌ Key is still the default placeholder');
    return false;
  }
  
  // Check format
  if (!key.startsWith('sk-or-v1-')) {
    console.log('❌ Key should start with "sk-or-v1-"');
    return false;
  }
  
  if (key.length < 50) {
    console.log('❌ Key appears too short (should be 60+ characters)');
    return false;
  }
  
  console.log('✅ Grok API key format looks correct');
  return true;
}

function checkGeminiKey(key) {
  console.log('\n🔍 Checking Gemini API Key Format:');
  
  if (!key) {
    console.log('❌ No Gemini API key found');
    return false;
  }
  
  console.log(`Key length: ${key.length} characters`);
  
  // Check for placeholder patterns
  if (key.includes('YOUR_REAL') || key.includes('PLACEHOLDER')) {
    console.log('❌ Key contains placeholder text');
    return false;
  }
  
  if (key.startsWith('AIzaSyAvEr55')) {
    console.log('❌ Key is still the default placeholder');
    return false;
  }
  
  // Check format
  if (!key.startsWith('AIzaSy')) {
    console.log('❌ Key should start with "AIzaSy"');
    return false;
  }
  
  if (key.length !== 39) {
    console.log('❌ Key should be exactly 39 characters long');
    return false;
  }
  
  console.log('✅ Gemini API key format looks correct');
  return true;
}

// Check current keys
const grokValid = checkGrokKey(process.env.GROK_API_KEY);
const geminiValid = checkGeminiKey(process.env.GEMINI_API_KEY);

console.log('\n' + '='.repeat(40));
if (grokValid && geminiValid) {
  console.log('✅ Both API keys have correct formats!');
  console.log('Now run "node verify-keys.js" to test if they work');
} else {
  console.log('🔧 Issues found with API key formats');
  console.log('Please check the messages above and update your keys in .env file');
}
console.log('='.repeat(40));