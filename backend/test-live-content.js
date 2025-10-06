/**
 * Test enhanced content with live server
 */

async function testEnhancedContent() {
  try {
    const response = await fetch('http://localhost:3000/news?limit=5');
    const data = await response.json();
    
    console.log('✅ Enhanced Content Test Results:');
    console.log('=' .repeat(50));
    
    data.data.forEach((article, i) => {
      console.log(`${i+1}. "${article.title.substring(0, 60)}..."`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Summary: ${article.summary?.length || 0} characters`);
      console.log(`   Content: ${article.content?.length || 0} characters`);
      console.log(`   Summary: ${(article.summary || 'None').substring(0, 100)}...`);
      console.log(`   Content: ${(article.content || 'None').substring(0, 100)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testEnhancedContent();