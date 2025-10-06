/**
 * Check available Gemini models
 */

require('dotenv').config();
const { safeFetch } = require('./lib/utils');

async function listModels() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  console.log('🔍 Checking available Gemini models...\n');
  
  try {
    const response = await safeFetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.success) {
      console.log('✅ Available models:');
      response.data.models.forEach(model => {
        console.log(`- ${model.name}`);
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`  👍 Supports generateContent`);
        }
      });
    } else {
      console.log('❌ Failed to fetch models:', response.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

listModels();