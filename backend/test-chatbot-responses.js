/**
 * Test different types of chatbot interactions
 */

require('dotenv').config();
const { getAIResponse } = require('./lib/ai');

async function testChatbotResponses() {
  console.log('🧪 Testing Chatbot Conversational Abilities...\n');
  
  const sampleArticle = `Title: Tech CEO John Smith Announces Revolutionary AI Breakthrough
Content: Tech entrepreneur John Smith, CEO of InnovateAI Corp, announced today a groundbreaking artificial intelligence system that can process natural language 50 times faster than current models. Smith, who previously worked at Google and Microsoft, founded InnovateAI in 2020. The new system, called "LightSpeed AI," uses quantum computing principles to achieve unprecedented processing speeds. The announcement was made at the Global Tech Summit in San Francisco, where Smith demonstrated the technology to over 500 attendees. The company plans to release this technology commercially by Q2 2024.`;
  
  const testQuestions = [
    'hi',
    'hello there',
    'Who is John Smith?',
    'Tell me about the CEO',
    'What is John Smith\'s background?',
    'What company did he work for before?'
  ];
  
  for (const question of testQuestions) {
    console.log(`\n🤖 Question: "${question}"`);
    console.log('🔄 Processing...');
    
    try {
      const response = await getAIResponse(sampleArticle, question);
      console.log(`✅ Response: ${response.answer}`);
      console.log(`📊 Model: ${response.model}, Grounded: ${response.grounded}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(80));
  }
}

// Run the test
testChatbotResponses().catch(console.error);