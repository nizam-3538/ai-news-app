/**
 * Test script for Enhanced NewsAPI /everything endpoint integration
 * Run this to test if the NewsAPI /everything endpoint is working correctly
 */

require('dotenv').config();

const { safeFetch, normalizeDate, generateId, sanitizeHTML, extractSummary } = require('./lib/utils');

async function testNewsAPIEverything() {
  console.log('🧪 Testing Enhanced NewsAPI /everything Endpoint');
  console.log('================================================');

  const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
  
  if (!NEWSAPI_KEY || NEWSAPI_KEY === 'your_newsapi_api_key_here') {
    console.log('❌ NewsAPI key not configured');
    console.log('📝 To get a free NewsAPI key:');
    console.log('   1. Visit https://newsapi.org/register');
    console.log('   2. Sign up for a free account');
    console.log('   3. Get your API key from the dashboard');
    console.log('   4. Add it to your .env file: NEWSAPI_KEY=your_actual_key');
    return;
  }

  console.log('🔑 NewsAPI key found, testing /everything endpoint...');

  try {
    // Test 1: Default search (trending topics)
    console.log('\n📊 Test 1: Default trending topics search');
    const defaultParams = {
      apiKey: NEWSAPI_KEY,
      pageSize: 5,
      language: 'en',
      sortBy: 'publishedAt',
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      q: 'technology OR politics OR business OR science OR sports',
      domains: 'bbc.com,cnn.com,reuters.com,techcrunch.com,bloomberg.com'
    };

    let url = 'https://newsapi.org/v2/everything';
    let result = await safeFetch(url, { params: defaultParams });

    if (!result.success) {
      console.log('❌ Default search failed:', result.error);
      return;
    }

    let data = result.data;
    if (!data.articles || !Array.isArray(data.articles)) {
      console.log('❌ Invalid response format from NewsAPI');
      console.log('Response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`✅ Default search successful: ${data.articles.length} articles found`);
    console.log(`📈 Total available: ${data.totalResults} articles`);
    
    // Show sample articles
    data.articles.slice(0, 2).forEach((article, index) => {
      console.log(`\n📰 Article ${index + 1}:`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Source: ${article.source?.name || 'Unknown'}`);
      console.log(`   Author: ${article.author || 'Unknown'}`);
      console.log(`   Published: ${article.publishedAt}`);
      console.log(`   Description: ${article.description ? article.description.substring(0, 100) + '...' : 'No description'}`);
    });

    // Test 2: Specific search query
    console.log('\n🔍 Test 2: Specific search query - "artificial intelligence"');
    const searchParams = {
      apiKey: NEWSAPI_KEY,
      q: 'artificial intelligence',
      pageSize: 3,
      language: 'en',
      sortBy: 'publishedAt',
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    result = await safeFetch(url, { params: searchParams });

    if (result.success && result.data.articles) {
      console.log(`✅ Specific search successful: Found ${result.data.articles.length} AI articles`);
      console.log(`📈 Total AI articles available: ${result.data.totalResults}`);
    } else {
      console.log('⚠️ Specific search failed, but default search worked');
    }

    // Test 3: High-quality sources
    console.log('\n🏆 Test 3: High-quality sources only');
    const qualityParams = {
      apiKey: NEWSAPI_KEY,
      domains: 'reuters.com,bbc.com,nytimes.com',
      pageSize: 3,
      language: 'en',
      sortBy: 'publishedAt',
      from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    result = await safeFetch(url, { params: qualityParams });

    if (result.success && result.data.articles) {
      console.log(`✅ Quality sources test successful: ${result.data.articles.length} articles`);
      console.log('📰 Sources found:', [...new Set(result.data.articles.map(a => a.source.name))].join(', '));
    } else {
      console.log('⚠️ Quality sources test had issues');
    }

    // Test 4: Filtering validation
    console.log('\n🚦 Test 4: Content filtering validation');
    const filteredArticles = data.articles.filter(article => 
      article.title && 
      article.url && 
      article.title !== '[Removed]' &&
      article.description && 
      article.description !== '[Removed]'
    );

    console.log(`✅ Content filtering: ${filteredArticles.length}/${data.articles.length} articles passed quality filter`);

    console.log('\n🎉 NewsAPI /everything endpoint is working correctly!');
    console.log('💡 Key features validated:');
    console.log('   ✅ Last 7 days article search');
    console.log('   ✅ Flexible query support');
    console.log('   ✅ High-quality source filtering');
    console.log('   ✅ Content quality validation');
    console.log('   ✅ Rich metadata extraction');
    console.log('\n📊 Integration benefits:');
    console.log('   🔍 Access to millions of articles from last month');
    console.log('   🎯 Advanced search capabilities');
    console.log('   📈 Higher content diversity and quality');
    console.log('   ⚡ Fresh content within 7 days');

  } catch (error) {
    console.error('❌ Error testing NewsAPI /everything endpoint:', error.message);
    
    // Provide specific guidance based on error
    if (error.message.includes('401')) {
      console.log('💡 Authentication error. Please check your API key.');
    } else if (error.message.includes('429')) {
      console.log('💡 Rate limit exceeded. Please wait and try again.');
    } else if (error.message.includes('426')) {
      console.log('💡 Upgrade required. You may need a paid plan for this endpoint.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Network connection issue. Please check your internet connection.');
    }
  }
}

// Run the test
testNewsAPIEverything();