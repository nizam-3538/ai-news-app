/**
 * Test script for GNews API integration
 * Run this to test if the GNews API is working correctly
 */

require('dotenv').config();

const { safeFetch, normalizeDate, generateId, sanitizeHTML, extractSummary } = require('./lib/utils');

async function testGNewsAPI() {
  console.log('🧪 Testing GNews API Integration');
  console.log('================================');

  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
  
  if (!GNEWS_API_KEY || GNEWS_API_KEY === 'your_gnews_api_key_here') {
    console.log('❌ GNews API key not configured');
    console.log('📝 To get a free GNews API key:');
    console.log('   1. Visit https://gnews.io/');
    console.log('   2. Sign up for a free account');
    console.log('   3. Get your API key from the dashboard');
    console.log('   4. Add it to your .env file: GNEWS_API_KEY=your_actual_key');
    return;
  }

  console.log('🔑 GNews API key found, testing connection...');

  try {
    // Test basic top headlines
    const params = {
      token: GNEWS_API_KEY,
      max: 5,
      lang: 'en',
      sortby: 'publishedAt'
    };

    const url = 'https://gnews.io/api/v4/top-headlines';
    const result = await safeFetch(url, { params });

    if (!result.success) {
      console.log('❌ GNews API request failed:', result.error);
      return;
    }

    const data = result.data;
    
    if (!data.articles || !Array.isArray(data.articles)) {
      console.log('❌ Invalid response format from GNews API');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`✅ Successfully fetched ${data.articles.length} articles from GNews API`);
    
    // Show sample articles
    data.articles.slice(0, 3).forEach((article, index) => {
      console.log(`\n📰 Article ${index + 1}:`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Source: ${article.source?.name || 'Unknown'}`);
      console.log(`   Published: ${article.publishedAt}`);
      console.log(`   URL: ${article.url}`);
    });

    console.log('\n🎉 GNews API integration is working correctly!');
    console.log('💡 The API is now integrated and will be used alongside other news sources.');

  } catch (error) {
    console.error('❌ Error testing GNews API:', error.message);
  }
}

// Run the test
testGNewsAPI();