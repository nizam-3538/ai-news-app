require('dotenv').config();

console.log('Environment Variables Check:');
console.log('==========================');
console.log('GROK_API_KEY:', process.env.GROK_API_KEY ? `${process.env.GROK_API_KEY.substring(0, 15)}...${process.env.GROK_API_KEY.slice(-10)}` : 'NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 15)}...${process.env.GEMINI_API_KEY.slice(-10)}` : 'NOT SET');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);