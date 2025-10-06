// Compare API keys between different modules
require('dotenv').config();

// Load API keys as in analyze.js
const GEMINI_API_KEY_ANALYZE = process.env.GEMINI_API_KEY;
const GROK_API_KEY_ANALYZE = process.env.GROK_API_KEY;

// Load API keys as in news.js
const GEMINI_API_KEY_NEWS = process.env.GEMINI_API_KEY;

console.log('API Key Comparison:');
console.log('==================');
console.log('Analyze.js GEMINI_API_KEY:', GEMINI_API_KEY_ANALYZE);
console.log('News.js GEMINI_API_KEY:', GEMINI_API_KEY_NEWS);
console.log('Are they the same?', GEMINI_API_KEY_ANALYZE === GEMINI_API_KEY_NEWS);

console.log('\nGrok API Keys:');
console.log('Analyze.js GROK_API_KEY:', GROK_API_KEY_ANALYZE);