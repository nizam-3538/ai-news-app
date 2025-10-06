/**
 * Check status of all News APIs
 */

require('dotenv').config();

async function checkAPIStatus() {
  console.log('📊 NEWS API STATUS CHECK');
  console.log('========================\n');

  const apis = [
    { name: 'NewsAPI', key: process.env.NEWSAPI_KEY, url: 'https://newsapi.org/v2/top-headlines?country=us&apiKey=' },
    { name: 'GNews', key: process.env.GNEWS_API_KEY, url: 'https://gnews.io/api/v4/top-headlines?token=' },
    { name: 'NewsData.io', key: process.env.NEWSDATA_API_KEY, url: 'https://newsdata.io/api/1/latest?apikey=' }
  ];

  const needKeys = [];

  for (const api of apis) {
    console.log(`🔍 Checking ${api.name}...`);
    
    if (!api.key || api.key.includes('your_') || api.key.includes('_here')) {
      console.log(`❌ ${api.name}: No valid API key configured`);
      needKeys.push(api.name);
    } else {
      console.log(`✅ ${api.name}: API key found`);
      
      // Quick test of the API
      try {
        let testUrl = api.url + api.key;
                
        // Special handling for different API formats
        if (api.name === 'NewsData.io') {
          testUrl += '&size=1&language=en';
        } else if (api.name === 'GNews') {
          testUrl += '&max=1';
        } else {
          testUrl += '&max=1';
        }
                
        const response = await fetch(testUrl);
        const data = await response.json();
        
        if (response.ok && !data.error) {
          console.log(`🟢 ${api.name}: API working correctly`);
        } else {
          console.log(`🟡 ${api.name}: API key may be invalid - ${data.error || data.message || 'Unknown error'}`);
          needKeys.push(api.name);
        }
      } catch (error) {
        console.log(`🔴 ${api.name}: Connection failed - ${error.message}`);
        needKeys.push(api.name);
      }
    }
    console.log('');
  }

  console.log('🎯 SUMMARY');
  console.log('==========');
  if (needKeys.length === 0) {
    console.log('🎉 All APIs are working correctly!');
  } else {
    console.log(`⚠️  APIs that need valid keys: ${needKeys.join(', ')}`);
    console.log('\n📝 To get API keys:');
    needKeys.forEach(api => {
      switch(api) {
        case 'NewsAPI':
          console.log(`   • NewsAPI: https://newsapi.org/register`);
          break;
        case 'GNews':
          console.log(`   • GNews: https://gnews.io/`);
          break;
        case 'NewsData.io':
          console.log(`   • NewsData.io: https://newsdata.io/`);
          break;
      }
    });
  }
}

checkAPIStatus();