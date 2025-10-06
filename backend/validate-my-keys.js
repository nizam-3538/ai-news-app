/**
 * Script to validate your API keys securely
 * This script will test your API keys without exposing them
 */

const axios = require('axios');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('API Key Validator');
console.log('================');
console.log('This script will help you validate your API keys securely.');
console.log('Your keys are never shared or stored anywhere.\n');

// Function to test Gemini API key
async function testGeminiKey(key) {
  if (!key || key.length < 10) {
    return { valid: false, message: 'Invalid key format' };
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
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
    
    if (response.data.candidates && response.data.candidates[0].content) {
      return { valid: true, message: 'Valid Gemini API key!' };
    } else {
      return { valid: false, message: 'Unexpected response format' };
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        return { valid: false, message: 'Invalid Gemini API key (401 Unauthorized)' };
      } else if (error.response.status === 400) {
        return { valid: false, message: 'Invalid key or request (400 Bad Request)' };
      } else {
        return { valid: false, message: `API error: ${error.response.status}` };
      }
    } else {
      return { valid: false, message: 'Network error or timeout' };
    }
  }
}

// Main validation function
async function validateKeys() {
  console.log('Note: Grok (legacy) support removed from this project. Use GROQ_API_KEY if you have a different provider.');
  
  console.log('\n2. Testing Gemini API Key...');
  rl.question('Enter your Gemini API key (or press Enter to skip): ', async (geminiKey) => {
    if (geminiKey.trim()) {
      const geminiResult = await testGeminiKey(geminiKey.trim());
      console.log(geminiResult.valid ? '✅ ' : '❌ ', geminiResult.message);
    } else {
      console.log('⏭️  Skipped Gemini API key test');
    }
    
    console.log('\nValidation complete!');
    console.log('If any keys were invalid, please check that you:');
    console.log('1. Copied the complete key correctly');
    console.log('2. Are using the correct key for the right service');
    console.log('3. Haven\'t exceeded usage limits');
    rl.close();
  });
}

// Run validation
validateKeys();