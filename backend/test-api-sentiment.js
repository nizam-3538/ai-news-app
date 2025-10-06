/**
 * Simple test to check API integration
 */

// Load environment variables
require('dotenv').config();

// Import utils directly to test individual API functions
const { safeFetch, analyzeSentiment } = require('./lib/utils');

async function testSentimentDirectly() {
  console.log('Testing sentiment function directly...');
  
  const testHeadlines = [
    'Breaking: Major victory in championship',
    'Crisis deepens as situation worsens',
    'Company announces quarterly results'
  ];
  
  for (const headline of testHeadlines) {
    const sentiment = await analyzeSentiment(headline);
    console.log(`"${headline}" -> ${sentiment}`);
  }
}

async function testLiveAPI() {
  console.log('\nTesting live API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/news?limit=3');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`\nAPI returned ${data.data.length} articles:`);
    
    data.data.forEach((article, i) => {
      console.log(`${i+1}. "${article.title.substring(0, 60)}..."`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Sentiment: ${article.sentiment || 'undefined'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

async function runTests() {
  await testSentimentDirectly();
  await testLiveAPI();
}

runTests();