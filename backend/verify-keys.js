/**
 * Script to verify API keys are working correctly
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_MODEL = process.env.GROQ_API_MODEL || 'grok-4-latest';
// Note: legacy GROK API variable removed from project

console.log('🔑 API Key Verification Tool');
console.log('==========================');

async function verifyGrokKey() {
  console.log('\n🔍 Testing Groq/GROQ API Key...');
  
  if (!GROQ_API_KEY || GROQ_API_KEY.includes('YOUR_REAL') || GROQ_API_KEY.startsWith('sk-or-v1-e0b1a07')) {
    console.log('⚠️  Groq API key not set or still using placeholder');
    return false;
  }
  
  try {
    const response = await axios.post(GROQ_API_URL, {
      model: GROQ_API_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message. Please respond with "Test successful" and nothing else.'
        }
      ],
      max_tokens: 20,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    if (response.data.choices && response.data.choices[0].message) {
      const message = response.data.choices[0].message.content.trim();
      console.log('✅ Groq API key is VALID');
      console.log(`   Response: "${message}"`);
      return true;
    } else {
      console.log('❌ Groq API key is INVALID (unexpected response format)');
      return false;
    }
  } catch (error) {
    console.log('❌ Groq API key is INVALID');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      if (error.response.data) {
        console.log(`   Error: ${error.response.data.error || JSON.stringify(error.response.data)}`);
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function verifyGeminiKey() {
  console.log('\n🔍 Testing Gemini API Key...');
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('YOUR_REAL') || process.env.GEMINI_API_KEY.startsWith('AIzaSyAvEr55')) {
    console.log('⚠️  Gemini API key not set or still using placeholder');
    return false;
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Hello, this is a test message. Please respond with "Test successful" and nothing else.'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.1
        }
      },
      {
        timeout: 15000
      }
    );
    
    if (response.data.candidates && response.data.candidates[0].content) {
      const message = response.data.candidates[0].content.parts[0].text.trim();
      console.log('✅ Gemini API key is VALID');
      console.log(`   Response: "${message}"`);
      return true;
    } else {
      console.log('❌ Gemini API key is INVALID (unexpected response format)');
      return false;
    }
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
    return false;
  }
}

async function main() {
  console.log('Current API keys in .env file:');
  console.log(`GROQ_API_KEY: ${GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 15)}...${GROQ_API_KEY.substring(GROQ_API_KEY.length - 10)}` : 'NOT SET'}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 15)}...${process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 5)}` : 'NOT SET'}`);
  
  const grokValid = await verifyGrokKey();
  const geminiValid = await verifyGeminiKey();
  
  console.log('\n' + '='.repeat(50));
  // GROQ is optional: require Gemini for full AI capabilities
  if (geminiValid) {
    console.log('🎉 Gemini API key is working. Basic AI features are available.');
    if (grokValid) {
      console.log('🎉 GROQ/Grok key is also valid — full provider options available.');
    } else {
      console.log('⚠️  GROQ/Grok key is NOT valid or not set. GROQ is optional — continuing with Gemini.');
      console.log('   To enable additional provider options, update GROQ_API_KEY.');
    }
  } else {
    console.log('🔧 Gemini API key needs attention and must be updated for AI features to work.');
  }
  
  console.log('='.repeat(50));
}

main();