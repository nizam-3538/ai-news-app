/**
 * Test script to check API key validity and show image availability
 */

require('dotenv').config();

async function testAPIKeys() {
    console.log('🔑 Testing API Keys...\n');
    
    const APIs = [
        {
            name: 'NewsAPI',
            key: process.env.NEWSAPI_KEY,
            testUrl: (key) => `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${key}`,
            hasImages: true
        },
        {
            name: 'GNews',
            key: process.env.GNEWS_API_KEY,
            testUrl: (key) => `https://gnews.io/api/v4/top-headlines?token=${key}&lang=en&max=5`,
            hasImages: true
        },
        {
            name: 'NewsData.io',
            key: process.env.NEWSDATA_API_KEY,
            testUrl: (key) => `https://newsdata.io/api/1/news?apikey=${key}&language=en&size=5`,
            hasImages: true
        }
    ];
    
    for (const api of APIs) {
        console.log(`📡 Testing ${api.name}:`);
        console.log(`   Key: ${api.key ? api.key.substring(0, 10) + '...' : 'NOT SET'}`);
        
        if (!api.key || api.key.includes('your_') || api.key.includes('placeholder')) {
            console.log(`   ❌ API key appears to be placeholder/invalid`);
            console.log(`   📸 Images available: ${api.hasImages ? 'YES' : 'NO'}`);
            console.log('');
            continue;
        }
        
        try {
            const response = await fetch(api.testUrl(api.key));
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                let articles = [];
                
                // Extract articles based on API format
                if (api.name === 'NewsAPI') {
                    articles = data.articles || [];
                } else if (api.name === 'GNews') {
                    articles = data.articles || [];
                } else if (api.name === 'NewsData.io') {
                    articles = data.results || [];
                }
                
                console.log(`   ✅ Success! Fetched ${articles.length} articles`);
                
                // Check for images in first article
                if (articles.length > 0) {
                    const firstArticle = articles[0];
                    const hasImage = firstArticle.urlToImage || firstArticle.image || firstArticle.image_url;
                    console.log(`   📸 First article has image: ${hasImage ? 'YES' : 'NO'}`);
                    if (hasImage) {
                        const imageUrl = firstArticle.urlToImage || firstArticle.image || firstArticle.image_url;
                        console.log(`   🖼️  Image URL: ${imageUrl.substring(0, 50)}...`);
                    }
                }
            } else {
                console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(`   📸 Images available: ${api.hasImages ? 'YES' : 'NO'}`);
        console.log('');
    }
    
    console.log('💡 To see images in your news app:');
    console.log('1. Get valid API keys from:');
    console.log('   - NewsAPI: https://newsapi.org/register');
    console.log('   - GNews: https://gnews.io/register');
    console.log('   - NewsData.io: https://newsdata.io/register');
    console.log('2. Update your .env file with real API keys');
    console.log('3. Restart the server');
    console.log('4. Articles from APIs will include images!');
}

// Run the test
testAPIKeys().catch(console.error);