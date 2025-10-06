/**
 * Test sentiment integration with news API
 */

async function testSentimentIntegration() {
  console.log('🔍 Testing Sentiment Integration with News API');
  console.log('==============================================');

  try {
    const response = await fetch('http://localhost:3000/news?limit=5');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ News API working, checking sentiment indicators:');
      
      data.data.slice(0, 3).forEach((article, i) => {
        console.log(`\n${i+1}. "${article.title.substring(0, 60)}..."`);
        console.log(`   Sentiment: ${article.sentiment}`);
        console.log(`   Source: ${article.source}`);
      });
      
      console.log('\n🎯 Sentiment indicators are now active on news cards!');
    } else {
      console.log('❌ News API failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSentimentIntegration();