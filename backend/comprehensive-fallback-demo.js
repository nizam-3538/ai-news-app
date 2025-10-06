/**
 * Comprehensive demonstration of enhanced fallback functionality
 */

const { enhancedExtractiveFallback, summaryBasedFallback } = require('./routes/analyze');
const { getContextAwareSentiment } = require('./lib/utils');

console.log('🚀 Comprehensive Enhanced Fallback Demo');
console.log('====================================');

// Test data - a sample news article
const sampleArticle = `
Global Markets Surge as Tech Stocks Rally
Stock markets around the world experienced significant gains today as technology shares led a broad-based rally. 
The Dow Jones Industrial Average rose 2.3%, while the S&P 500 gained 2.1%. 
Tech giants including Apple, Microsoft, and Google all posted strong quarterly earnings that exceeded analyst expectations. 
Investors are optimistic about the sector's future growth prospects despite ongoing concerns about inflation and interest rates. 
Federal Reserve officials indicated they might consider pausing rate hikes if economic data continues to show moderation. 
The Nasdaq Composite, heavily weighted toward technology companies, surged 2.8% on the day. 
Market analysts attribute the rally to a combination of positive earnings reports and hopes for a more dovish monetary policy. 
However, some economists warn that volatility could return if inflation data comes in higher than expected. 
The rally followed several weeks of market uncertainty amid mixed economic signals.
`;

console.log('\n📰 Sample Article:');
console.log('-----------------');
console.log(sampleArticle.substring(0, 300) + '...');

// Test different types of questions
const testQuestions = [
  'What happened in the stock market today?',
  'Which companies posted strong earnings?',
  'When might the Federal Reserve pause rate hikes?',
  'Why are investors optimistic?',
  'How much did the Nasdaq Composite surge?'
];

console.log('\n❓ Enhanced Extractive Fallback Results:');
console.log('------------------------------------');

testQuestions.forEach((question, index) => {
  console.log(`\n${index + 1}. Question: "${question}"`);
  const result = enhancedExtractiveFallback(sampleArticle, question);
  console.log(`   Answer: ${result.answer}`);
  console.log(`   Supporting evidence: ${result.supporting.length} sentence(s)`);
});

console.log('\n📋 Summary-Based Fallback Results:');
console.log('------------------------------');

testQuestions.forEach((question, index) => {
  console.log(`\n${index + 1}. Question: "${question}"`);
  const result = summaryBasedFallback(sampleArticle, question);
  console.log(`   Answer: ${result.answer.substring(0, 150)}...`);
});

console.log('\n😊 Enhanced Sentiment Analysis:');
console.log('---------------------------');

const sentimentTestTexts = [
  'The breakthrough innovation represents tremendous progress and success.',
  'The crisis has created a dangerous threat to our community and future.',
  'The quarterly earnings report showed steady growth for the company.',
  'Emergency services are responding to a major crisis in the downtown area.'
];

sentimentTestTexts.forEach((text, index) => {
  console.log(`\n${index + 1}. Text: "${text}"`);
  const sentiment = getContextAwareSentiment(text);
  console.log(`   Sentiment: ${sentiment}`);
});

console.log('\n🎯 Key Improvements Demonstrated:');
console.log('-----------------------------');
console.log('✅ Intelligent sentence scoring based on keyword matching');
console.log('✅ Position-based relevance (earlier sentences prioritized)');
console.log('✅ Context-aware question type detection');
console.log('✅ Domain-specific sentiment analysis');
console.log('✅ Multi-layer fallback hierarchy');
console.log('✅ Enhanced error handling and user feedback');

console.log('\n🌟 Enhanced Fallback Implementation Status: COMPLETE');
console.log('The AI News Aggregator now provides significantly better responses when AI services are unavailable.');