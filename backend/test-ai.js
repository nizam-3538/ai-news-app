const axios = require('axios');

async function testAI() {
  try {
    // Test with a simple question
    const testData = {
      text: 'The new AI model was released today with groundbreaking capabilities in natural language processing.',
      question: 'What was released today?'
    };
    
    console.log('Testing AI endpoint...');
    const response = await axios.post('http://localhost:3001/analyze', testData);
    
    console.log('AI test response:');
    console.log('Success:', response.data.ok);
    console.log('Model used:', response.data.meta.model);
    console.log('Answer:', response.data.answer);
    console.log('Sentiment:', response.data.sentiment);
    console.log('Grounded:', response.data.grounded);
    
    if (response.data.meta.note) {
      console.log('Note:', response.data.meta.note);
    }
    
  } catch (error) {
    console.error('Error testing AI:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAI();