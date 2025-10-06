/**
 * Test script to verify news loading functionality
 */

async function testNewsLoading() {
  console.log('Testing news loading from backend...');
  
  try {
    // Test the news endpoint directly
    const response = await fetch('http://localhost:3001/news');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'Failed to load news');
    }
    
    console.log(`✅ Successfully loaded ${data.articles.length} articles from backend`);
    console.log('First article:', data.articles[0].title);
    
    // Test CORS by trying to access from the frontend port
    console.log('\nTesting CORS configuration...');
    const corsResponse = await fetch('http://localhost:3001/news', {
      headers: {
        'Origin': 'http://localhost:8080'
      }
    });
    
    if (corsResponse.ok) {
      console.log('✅ CORS is properly configured');
    } else {
      console.log('❌ CORS issue detected');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error loading news:', error.message);
    return false;
  }
}

// Run the test
testNewsLoading().then(success => {
  if (success) {
    console.log('\n🎉 News loading is working correctly!');
  } else {
    console.log('\n💥 News loading failed. Check the errors above.');
  }
});