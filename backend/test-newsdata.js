/**
 * Test script for NewsData.io API integration
 * Run this to test if the NewsData.io API is working correctly
 */

require('dotenv').config();

const { safeFetch, normalizeDate, generateId, sanitizeHTML, extractSummary } = require('./lib/utils');

async function testNewsDataAPI() {
  console.log('🧪 Testing NewsData.io API Integration');
  console.log('=====================================');

  const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;
  
  if (!NEWSDATA_API_KEY || NEWSDATA_API_KEY === 'your_newsdata_api_key_here') {
    console.log('❌ NewsData.io API key not configured');
    console.log('📝 To get a free NewsData.io API key:');
    console.log('   1. Visit https://newsdata.io/');
    console.log('   2. Sign up for a free account');
    console.log('   3. Get your API key from the dashboard');
    console.log('   4. Add it to your .env file: NEWSDATA_API_KEY=your_actual_key');
    return;
  }

  console.log('🔑 NewsData.io API key found, testing connection...');

  try {
    // Test basic latest news
    const params = {
      apikey: NEWSDATA_API_KEY,
      size: 5,
      language: 'en'
      // Removed timeframe as it might not be valid for this endpoint
    };

    const url = 'https://newsdata.io/api/1/latest';
    const result = await safeFetch(url, { params });

    if (!result.success) {
      console.log('❌ NewsData.io API request failed:', result.error);
      return;
    }

    const data = result.data;
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log('❌ Invalid response format from NewsData.io API');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`✅ Successfully fetched ${data.results.length} articles from NewsData.io API`);
    
    // Show sample articles
    data.results.slice(0, 3).forEach((article, index) => {
      console.log(`\n📰 Article ${index + 1}:`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Source: ${article.source_id || 'Unknown'}`);
      console.log(`   Published: ${article.pubDate}`);
      console.log(`   Country: ${article.country ? article.country.join(', ') : 'Unknown'}`);
      console.log(`   Categories: ${article.category ? article.category.join(', ') : 'None'}`);
      console.log(`   URL: ${article.link}`);
    });

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    
    const searchParams = {
      apikey: NEWSDATA_API_KEY,
      q: 'technology',
      size: 3,
      language: 'en'
    };

    const searchUrl = 'https://newsdata.io/api/1/news';
    const searchResult = await safeFetch(searchUrl, { params: searchParams });

    if (searchResult.success && searchResult.data.results) {
      console.log(`✅ Search test successful: Found ${searchResult.data.results.length} articles about "technology"`);
    } else {
      console.log('⚠️ Search test failed, but main API is working');
    }

    console.log('\n🎉 NewsData.io API integration is working correctly!');
    console.log('💡 The API is now integrated and will be used alongside other news sources.');
    console.log('📊 Features: Latest news, search, multiple countries, categorization, rich metadata');

  } catch (error) {
    console.error('❌ Error testing NewsData.io API:', error.message);
    
    // Provide specific guidance based on error
    if (error.message.includes('401')) {
      console.log('💡 This looks like an authentication error. Please check your API key.');
    } else if (error.message.includes('429')) {
      console.log('💡 Rate limit exceeded. Please wait a moment and try again.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Network connection issue. Please check your internet connection.');
    }
  }
}

// Run the test
testNewsDataAPI();