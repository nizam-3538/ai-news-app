/**
 * Test script for chatbot AI integration
 * Following API Testing Protocol from project specifications
 */

require('dotenv').config();
const { getAIResponse, isGreeting } = require('./lib/ai');

async function testChatbotAI() {
  console.log('🤖 CHATBOT AI INTEGRATION TEST');
  console.log('=' .repeat(50));
  
  // Test 1: API Key Validation
  console.log('\n1️⃣ Testing API Key Configuration:');
  const geminiKey = process.env.GEMINI_API_KEY;
  const grokKey = process.env.GROQ_API_KEY;
  
  console.log(`Gemini API Key: ${geminiKey ? `${geminiKey.substring(0, 10)}...${geminiKey.slice(-5)}` : 'NOT SET'}`);
  console.log(`GROQ API Key: ${grokKey ? `${grokKey.substring(0, 10)}...${grokKey.slice(-5)}` : 'NOT SET'}`);
  
  // Test 2: Greeting Detection
  console.log('\n2️⃣ Testing Greeting Detection:');
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'Hello there!'];
  greetings.forEach(greeting => {
    const isGreet = isGreeting(greeting);
    console.log(`"${greeting}" -> ${isGreet ? '✅ Greeting detected' : '❌ Not detected as greeting'}`);
  });
  
  // Test 3: AI Response with Article Context
  console.log('\n3️⃣ Testing AI Response with Article Context:');
  const testArticle = `
Title: Breaking News: Tech Company Launches Revolutionary AI Assistant

Content: A major technology company today announced the launch of their new AI assistant that promises to revolutionize how people interact with technology. The assistant uses advanced natural language processing and can help users with a wide variety of tasks including answering questions, providing summaries, and engaging in conversations. The company's CEO stated that this represents a significant breakthrough in artificial intelligence technology.
  `;
  
  const testQuestions = [
    'What is this article about?',
    'Who made this announcement?', 
    'What makes this AI assistant special?',
    'Can you summarize the key points?'
  ];
  
  for (const question of testQuestions) {
    try {
      console.log(`\\nQuestion: "${question}"`);
      const response = await getAIResponse(testArticle, question);
      console.log(`Model: ${response.model}`);
      console.log(`Answer: ${response.answer.substring(0, 100)}...`);
      console.log(`Grounded: ${response.grounded}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test 4: Conversation Context
  console.log('\n4️⃣ Testing Conversation Context:');
  const conversationTests = [
    { message: 'hi', expected: 'greeting' },
    { message: 'hello there', expected: 'greeting' },
    { message: 'What is this article about?', expected: 'analysis' },
    { message: 'Tell me more', expected: 'analysis' }
  ];
  
  for (const test of conversationTests) {
    const isGreet = isGreeting(test.message);
    console.log(`"${test.message}" -> ${isGreet ? 'Greeting' : 'Analysis needed'} (expected: ${test.expected})`);
  }
  
  console.log('\n🎯 CHATBOT TEST COMPLETE!');
}

testChatbotAI().catch(console.error);