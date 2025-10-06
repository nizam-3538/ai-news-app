/**
 * Test script for enhanced fallback functionality
 */

const { enhancedExtractiveFallback, summaryBasedFallback } = require('./routes/analyze');
const { analyzeSentiment, getContextAwareSentiment } = require('./lib/utils');

console.log('🧪 Testing Enhanced Fallback Functionality');
console.log('====================================');

// Test data
const sampleArticle = `
Scientists have made a groundbreaking discovery in renewable energy technology. 
Researchers at MIT have developed a new solar panel that is 50% more efficient than current models. 
This breakthrough could revolutionize the clean energy industry and significantly reduce carbon emissions. 
The new panels use a novel nanotechnology approach that captures a broader spectrum of light. 
Initial tests show remarkable results, with energy output increasing substantially even in low-light conditions. 
Environmental groups are praising this development as a major step forward in combating climate change. 
The technology is expected to be commercially available within the next two years. 
Experts predict this innovation will make solar power more accessible to communities worldwide.
`;

const sampleQuestions = [
  'What is the breakthrough discovery?',
  'How efficient are the new solar panels?',
  'When will this technology be available?',
  'Who developed this technology?',
  'Why is this important for the environment?'
];

console.log('\n📝 Testing Enhanced Extractive Fallback:');
console.log('--------------------------------');

sampleQuestions.forEach(question => {
  console.log(`\nQuestion: "${question}"`);
  const result = enhancedExtractiveFallback(sampleArticle, question);
  console.log(`Answer: ${result.answer.substring(0, 100)}...`);
  console.log(`Supporting evidence: ${result.supporting.length} sentence(s)`);
});

console.log('\n📋 Testing Summary-Based Fallback:');
console.log('----------------------------');

sampleQuestions.forEach(question => {
  console.log(`\nQuestion: "${question}"`);
  const result = summaryBasedFallback(sampleArticle, question);
  console.log(`Answer: ${result.answer.substring(0, 100)}...`);
});

console.log('\n😊 Testing Enhanced Sentiment Analysis:');
console.log('---------------------------------');

const positiveText = 'The new policy is a remarkable achievement that will benefit everyone. This breakthrough innovation represents tremendous progress.';
const negativeText = 'The situation is concerning and presents significant challenges. This crisis has created a dangerous threat to our community.';
const neutralText = 'The meeting was held at 3 PM in the main conference room. The agenda included several routine items.';

console.log(`\nPositive text: "${positiveText}"`);
console.log(`Sentiment: ${analyzeSentiment(positiveText)}`);

console.log(`\nNegative text: "${negativeText}"`);
console.log(`Sentiment: ${analyzeSentiment(negativeText)}`);

console.log(`\nNeutral text: "${neutralText}"`);
console.log(`Sentiment: ${analyzeSentiment(neutralText)}`);

console.log('\n🔍 Testing Context-Aware Sentiment:');
console.log('------------------------------');

const newsTexts = [
  'The stock market reached a record high today, boosting investor confidence.',
  'Emergency services are responding to a major crisis in the downtown area.',
  'The quarterly earnings report showed steady growth for the company.',
  'Scientists announced a breakthrough discovery in cancer research.'
];

newsTexts.forEach(text => {
  console.log(`\nText: "${text}"`);
  console.log(`Sentiment: ${getContextAwareSentiment(text)}`);
});

console.log('\n✅ Enhanced fallback testing complete!');