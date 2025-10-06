require('dotenv').config();
const axios = require('axios');

async function testGrokAPI() {
  console.log('Testing Grok API...');
  
  if (!process.env.GROK_API_KEY || process.env.GROK_API_KEY === 'your_grok_api_key_here') {
    console.log('❌ Grok API key not configured');
    return;
  }
  
  try {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-beta',
      messages: [
        {
          role: 'user',
          content: 'Hello!'
        }
      ],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Grok API test successful!');
    console.log('Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.log('❌ Grok API test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testGeminiAPI() {
  console.log('\nTesting Gemini API...');
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_google_gemini_api_key_here') {
    console.log('❌ Gemini API key not configured');
    return;
  }
  
  try {
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: 'Hello!'
        }]
      }],
      generationConfig: {
        maxOutputTokens: 10
      }
    });
    
    console.log('✅ Gemini API test successful!');
    console.log('Response:', response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.log('❌ Gemini API test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function runTests() {
  await testGrokAPI();
  await testGeminiAPI();
}

runTests();