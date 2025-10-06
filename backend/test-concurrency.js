/**
 * Simple test script to verify concurrency limiting
 */

require('dotenv').config();
const { fetchAllFeeds, DEFAULT_FEEDS } = require('./lib/rssClient');
const { fetchFromAllAPIs } = require('./routes/news');

async function testRSSConcurrency() {
  console.log('Testing RSS feed concurrency limiting...');
  
  try {
    // Test with a small subset of feeds to avoid overwhelming the system
    const testFeeds = DEFAULT_FEEDS.slice(0, 3); // Just test with 3 feeds
    
    console.log(`Testing with ${testFeeds.length} feeds and max concurrency of 2...`);
    const startTime = Date.now();
    
    const articles = await fetchAllFeeds(testFeeds, 5, 10, 2); // 2 max concurrency
    
    const endTime = Date.now();
    console.log(`✅ RSS concurrency test completed in ${endTime - startTime}ms`);
    console.log(`Fetched ${articles.length} articles`);
    
  } catch (error) {
    console.log('❌ RSS concurrency test failed:', error.message);
  }
}

async function testAPIConcurrency() {
  console.log('\nTesting API concurrency limiting...');
  
  try {
    console.log('Testing with max concurrency of 2...');
    const startTime = Date.now();
    
    const articles = await fetchFromAllAPIs('', 10, 2); // 2 max concurrency
    
    const endTime = Date.now();
    console.log(`✅ API concurrency test completed in ${endTime - startTime}ms`);
    console.log(`Fetched ${articles.length} articles`);
    
  } catch (error) {
    console.log('❌ API concurrency test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await testRSSConcurrency();
  await testAPIConcurrency();
}

runTests();