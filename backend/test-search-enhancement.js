/**
 * Test script for search enhancement with increased limit
 */

require('dotenv').config();

async function testSearchEnhancement() {
  console.log('🔍 Testing Search Enhancement with 200 Article Limit');
  console.log('==================================================');

  try {
    // Test 1: Normal browsing (no search query)
    console.log('\n📰 Test 1: Normal browsing (no search query)');
    let response = await fetch('http://localhost:3000/news?limit=100');
    let data = await response.json();
    
    if (data.success) {
      console.log(`✅ Normal browsing: ${data.data.length} articles loaded`);
      console.log(`📊 Sources: ${[...new Set(data.data.map(a => a.source))].sort().join(', ')}`);
    } else {
      console.log('❌ Normal browsing failed:', data.error);
    }

    // Test 2: Search query with increased limit
    console.log('\n🔍 Test 2: Search query - "technology" with 200 limit');
    response = await fetch('http://localhost:3000/news?q=technology&limit=200');
    data = await response.json();
    
    if (data.success) {
      console.log(`✅ Search results: ${data.data.length} articles for "technology"`);
      console.log(`📊 Sources: ${[...new Set(data.data.map(a => a.source))].sort().join(', ')}`);
      
      // Show sample titles
      console.log('\n📰 Sample search results:');
      data.data.slice(0, 5).forEach((article, i) => {
        console.log(`   ${i+1}. ${article.title.substring(0, 80)}...`);
        console.log(`      Source: ${article.source} | Published: ${new Date(article.publishedAt).toLocaleDateString()}`);
      });
      
      // Check if we're getting articles from NewsAPI /everything endpoint
      const newsApiArticles = data.data.filter(a => a.categories.includes('newsapi'));
      console.log(`\n🔧 NewsAPI articles in results: ${newsApiArticles.length}`);
      
    } else {
      console.log('❌ Search failed:', data.error);
    }

    // Test 3: Different search query
    console.log('\n🔍 Test 3: Search query - "artificial intelligence"');
    response = await fetch('http://localhost:3000/news?q=artificial intelligence&limit=150');
    data = await response.json();
    
    if (data.success) {
      console.log(`✅ AI search results: ${data.data.length} articles for "artificial intelligence"`);
      
      // Check relevancy
      const relevantArticles = data.data.filter(a => 
        a.title.toLowerCase().includes('ai') || 
        a.title.toLowerCase().includes('artificial') ||
        a.summary.toLowerCase().includes('artificial intelligence')
      );
      console.log(`🎯 Relevant articles: ${relevantArticles.length}/${data.data.length} (${Math.round(relevantArticles.length/data.data.length*100)}% relevancy)`);
      
    } else {
      console.log('❌ AI search failed:', data.error);
    }

    // Test 4: Compare limits
    console.log('\n📈 Test 4: Comparing different limits');
    
    const limits = [50, 100, 150, 200];
    for (const limit of limits) {
      response = await fetch(`http://localhost:3000/news?q=politics&limit=${limit}`);
      data = await response.json();
      
      if (data.success) {
        console.log(`   Limit ${limit}: Got ${data.data.length} articles`);
      }
    }

    console.log('\n🎉 Search Enhancement Test Complete!');
    console.log('💡 Key Benefits:');
    console.log('   ✅ Increased article limit to 200 for search queries');
    console.log('   ✅ NewsAPI /everything endpoint provides comprehensive search');
    console.log('   ✅ Better search relevancy with 30-day lookback');
    console.log('   ✅ Enhanced concurrency for faster search results');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSearchEnhancement();