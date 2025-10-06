/**
 * AI Service Module
 * Encapsulates all AI provider logic, including Gemini, Groq, and fallbacks.
 */

const { safeFetch } = require('./utils');



/**
 * Calls the Gemini AI API with corrected request format.
 */
async function callGeminiAI(articleText, question) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 35 || !GEMINI_API_KEY.startsWith('AIzaSy')) {
    console.warn('Gemini AI not configured or using placeholder key.');
    throw new Error('Gemini AI not configured');
  }

  // Use the correct model name and format the request properly
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // Properly formatted request body with less restrictive prompt
  const requestData = {
    contents: [
      {
        parts: [
          {
            text: `Context: ${articleText}

User: ${question}

You are a knowledgeable and friendly AI assistant. Respond naturally and conversationally. Use the article as just one source of information, but feel free to draw from your extensive knowledge to provide comprehensive, interesting, and helpful responses. Be engaging, informative, and don't limit yourself to only what's explicitly stated in the article. When users ask about yourself, explain that you're an AI here to help with questions and discussions.

Assistant:`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 500
    }
  };

  console.log('DEBUG: Calling Gemini API...');
  console.log('DEBUG: Model URL:', url);
  
  const response = await safeFetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    data: requestData,
  }, 30000); // Increased timeout to 30 seconds

  if (!response.success) {
    console.error('Gemini API error details:', {
      status: response.status,
      error: response.error,
      responseBody: response.responseBody
    });
    throw new Error(`Gemini API error: ${response.error}`);
  }

  const candidate = response.data.candidates?.[0];
  
  // Handle different response formats
  let responseText = '';
  if (candidate?.content?.parts?.[0]?.text) {
    responseText = candidate.content.parts[0].text;
  } else if (candidate?.content?.text) {
    responseText = candidate.content.text;
  } else if (candidate?.text) {
    responseText = candidate.text;
  }
  
  if (!responseText) {
    // Log the actual response structure for debugging
    console.log('Actual Gemini response structure:', JSON.stringify(response.data, null, 2));
    console.error('No text content found in response');
    throw new Error('No text content found in Gemini response');
  }

  return {
    answer: responseText.trim(),
    model: 'gemini-2.0-flash',
  };
}

/**
 * Calls the Groq AI API.
 */
async function callGroqAI(articleText, question) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('sk-or-v1-e0b1a07')) {
    console.warn('Groq AI not configured or using placeholder key.');
    throw new Error('Groq AI not configured');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const requestData = {
    model: 'llama3-8b-8192',
    messages: [{ role: 'user', content: `ARTICLE: ${articleText}\n\nQUESTION: ${question}` }],
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1,
    stop: null,
    stream: false,
  };

  console.log('DEBUG: Groq API URL:', url);
  console.log('DEBUG: Groq Request Data:', JSON.stringify(requestData, null, 2));

  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: requestData,
  });

  if (!response.success) {
    console.error('Groq API raw error:', response.error);
    throw new Error(`Groq API error: ${response.error.message || response.error}`);
  }

  const answer = response.data.choices?.[0]?.message?.content;
  if (!answer) {
    console.error('Invalid Groq AI response format:', response.data);
    throw new Error('Invalid Groq AI response format');
  }

  return {
    answer: answer.trim(),
    model: 'groq',
  };
}

/**
 * Simple fallback for when AI fails
 */
function simpleFallback(question) {
  const responses = [
    "I'm having trouble processing that right now. Could you try rephrasing your question?",
    "Sorry, I'm experiencing technical difficulties. Please try again in a moment.",
    "I'm unable to provide a detailed response at the moment. Please try asking again."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Gets an AI response using Gemini API with simple fallback.
 */
async function getAIResponse(articleText, question) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  // Validate Gemini API key
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 35 || !GEMINI_API_KEY.startsWith('AIzaSy')) {
    return {
      answer: simpleFallback(question),
      model: 'fallback',
      grounded: false,
      error: 'API key not configured'
    };
  }

  console.log('DEBUG: Using Gemini API directly for all questions.');
  
  try {
    const result = await callGeminiAI(articleText, question);
    console.log('DEBUG: Gemini AI response successful.');
    return { ...result, grounded: true };
  } catch (error) {
    console.error('DEBUG: Gemini AI failed:', error.message);
    return {
      answer: simpleFallback(question),
      model: 'fallback',
      grounded: false,
      error: error.message
    };
  }
}

/**
 * Test function to check if Gemini API is working
 */
async function testGeminiAPI() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  console.log('=== Gemini API Test ===');
  console.log('API Key present:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
  console.log('API Key starts with AIzaSy:', GEMINI_API_KEY ? GEMINI_API_KEY.startsWith('AIzaSy') : false);
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 35 || !GEMINI_API_KEY.startsWith('AIzaSy')) {
    console.log('❌ API Key validation failed');
    return { success: false, error: 'Invalid API key' };
  }
  
  console.log('✅ API Key validation passed');
  
  try {
    console.log('Testing API call...');
    const result = await callGeminiAI('Test article content', 'What is this about?');
    console.log('✅ API call successful');
    console.log('Response:', result.answer.substring(0, 100) + '...');
    return { success: true, result };
  } catch (error) {
    console.log('❌ API call failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { getAIResponse, callGeminiAI, callGroqAI, testGeminiAPI };
