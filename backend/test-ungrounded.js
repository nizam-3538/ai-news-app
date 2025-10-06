/**
 * Test the ungrounded model behavior
 */

require('dotenv').config();
const { getAIResponse } = require('./lib/ai');

async function testUngroundedResponses() {
  console.log('🧪 Testing Ungrounded AI Responses...\n');
  
  const telanganaArticle = `Title: Telangana Leaders to Meet Legal Counsel in Supreme Court Case
Content: Telangana Deputy Chief Minister Bhatti Vikramarka, Congress's state unit chief Mahesh Kumar Goud, and minister Ponnam Prabhakar are expected to travel to New Delhi soon to meet the legal counsel representing the state in Supreme Court. The leaders will discuss the ongoing legal proceedings and strategy for the state's position in various cases pending before the apex court.`;
  
  const testQuestions = [
    'hi',
    'Who are the key people involved?',
    'tell me about yourself',
    'What is Bhatti Vikramarka known for?',
    'Tell me about the Deputy Chief Minister'
  ];
  
  for (const question of testQuestions) {
    console.log(`\n🤖 Question: "${question}"`);
    console.log('🔄 Processing...');
    
    try {
      const response = await getAIResponse(telanganaArticle, question);
      console.log(`✅ Response: ${response.answer}`);
      console.log(`📊 Model: ${response.model}, Grounded: ${response.grounded}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(80));
  }
}

// Run the test
testUngroundedResponses().catch(console.error);