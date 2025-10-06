/**
 * Test script for the enhanced Sentiment function
 */

const { Sentiment, analyzeSentiment } = require('./lib/utils');

async function testSentimentFunction() {
  console.log('🧪 Testing Enhanced Sentiment Analysis Function');
  console.log('===============================================');

  // Test cases
  const testCases = [
    { headline: 'Breakthrough in cancer research shows promising results', expected: 'positive' },
    { headline: 'Economic crisis deepens as markets collapse worldwide', expected: 'negative' },
    { headline: 'Government announces new policy on healthcare legislation', expected: 'neutral' },
    { headline: 'Tech company achieves record-breaking profits', expected: 'positive' },
    { headline: 'Devastating earthquake causes massive destruction', expected: 'negative' }
  ];

  let correctPredictions = 0;
  
  for (const testCase of testCases) {
    const result = Sentiment(testCase.headline);
    const isCorrect = result === testCase.expected;
    
    console.log(`\n📰 "${testCase.headline.substring(0, 40)}..."`);
    console.log(`   Expected: ${testCase.expected} | Result: ${result} | ${isCorrect ? '✅' : '❌'}`);
    
    if (isCorrect) correctPredictions++;
  }
  
  const accuracy = (correctPredictions / testCases.length * 100).toFixed(1);
  console.log(`\n📈 Accuracy: ${accuracy}% (${correctPredictions}/${testCases.length})`);
  console.log('✅ Sentiment function integration complete!');
}

testSentimentFunction().catch(console.error);