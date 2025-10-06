/**
 * Test script to verify complete sentiment analysis integration
 * Tests both API and RSS feed sentiment analysis
 */

const { Sentiment, analyzeSentiment } = require('./lib/utils');
const { fetchSingleFeed } = require('./lib/rssClient');

async function testSentimentFunction() {
  console.log('🧪 Testing enhanced Sentiment function...\n');
  
  const testHeadlines = [
    'Breaking news: Major breakthrough in cancer research',
    'Economic crisis deepens as markets collapse',
    'Government announces new policy changes',
    'Devastating earthquake hits major city',
    'Tech company wins prestigious award for innovation',
    'Investigation reveals widespread corruption scandal'
  ];
  
  testHeadlines.forEach(headline => {
    const sentiment = Sentiment(headline);
    console.log(`Headline: "${headline}"`);
    console.log(`Sentiment: ${sentiment}\n`);
  });
}

async function testAnalyzeSentiment() {
  console.log('🔍 Testing analyzeSentiment wrapper function...\n');
  
  const testHeadlines = [
    'Amazing victory for local team',
    'Terrible disaster strikes region',
    'Company reports quarterly earnings'
  ];
  
  for (const headline of testHeadlines) {
    const sentiment = await analyzeSentiment(headline);
    console.log(`Headline: "${headline}"`);
    console.log(`Analyzed Sentiment: ${sentiment}\n`);
  }
}

async function testRSSFeedSentiment() {
  console.log('📰 Testing RSS feed sentiment integration...\n');
  
  try {
    // Test with a single feed
    const testFeed = {
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      source: 'BBC News Test',
      category: 'general'
    };
    
    console.log('Fetching articles from BBC RSS feed...');
    const articles = await fetchSingleFeed(testFeed, 5);
    
    console.log(`Fetched ${articles.length} articles with sentiment analysis:`);
    articles.forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   Sentiment: ${article.sentiment || 'undefined'}`);
      console.log(`   Source: ${article.source}\n`);
    });
    
  } catch (error) {
    console.error('Error testing RSS feed sentiment:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Running complete sentiment analysis tests...\n');
  console.log('=' .repeat(60));
  
  await testSentimentFunction();
  console.log('=' .repeat(60));
  
  await testAnalyzeSentiment();
  console.log('=' .repeat(60));
  
  await testRSSFeedSentiment();
  console.log('=' .repeat(60));
  
  console.log('✅ All sentiment analysis tests completed!');
}

// Run the tests
runAllTests().catch(console.error);