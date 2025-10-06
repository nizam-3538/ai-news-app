/**
 * Diagnostic script to check environment variable loading
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('=== Environment Variables Diagnostic ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('ENV file path:', require('path').join(__dirname, '.env'));

console.log('\n=== Environment Variables ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
console.log('GROK_API_KEY:', process.env.GROK_API_KEY);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n=== Key Validation ===');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;

console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
console.log('GEMINI_API_KEY is placeholder:', GEMINI_API_KEY === 'YOUR_REAL_GOOGLE_GEMINI_API_KEY_HERE' || (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSyAvEr55')));
console.log('GROK_API_KEY exists:', !!GROK_API_KEY);
console.log('GROK_API_KEY is placeholder:', GROK_API_KEY === 'YOUR_REAL_GROK_API_KEY_HERE' || (GROK_API_KEY && GROK_API_KEY.startsWith('sk-or-v1-e0b1a07')));

console.log('\n=== Process Environment ===');
console.log('process.env keys:', Object.keys(process.env).filter(key => key.includes('KEY') || key.includes('API') || key.includes('SECRET')).sort());