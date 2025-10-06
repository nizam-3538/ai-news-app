/**
 * Test NewsData.io API directly and create mock article with image
 */

require('dotenv').config();
const { safeFetch } = require('./lib/utils');

async function testNewsDataDirect() {
    console.log('🧪 Testing NewsData.io API directly...\n');
    
    const apiKey = process.env.NEWSDATA_API_KEY;
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET'}`);
    
    try {
        // Test with simple parameters
        const params = {
            apikey: apiKey,
            size: 3,
            language: 'en',
            category: 'technology'
        };
        
        const url = 'https://newsdata.io/api/1/news';
        const result = await safeFetch(url, { params });
        
        if (result.success) {
            console.log('✅ NewsData.io API is working!');
            console.log(`Articles returned: ${result.data.results?.length || 0}`);
            
            if (result.data.results && result.data.results.length > 0) {
                const firstArticle = result.data.results[0];
                console.log('\n📄 First article:');
                console.log(`Title: ${firstArticle.title}`);
                console.log(`Image URL: ${firstArticle.image_url || 'NO IMAGE'}`);
                
                if (firstArticle.image_url) {
                    console.log('\n🎉 SUCCESS! Article has image URL!');
                    console.log('\nTo see images in your app:');
                    console.log('1. Update your .env file with a valid NewsData.io API key');
                    console.log('2. Restart the server');
                    console.log('3. Images will appear above the summary as designed!');
                    
                    // Create a test HTML file to show image working
                    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Article Image</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="card">
            <div class="card-header">
                <h1>${firstArticle.title}</h1>
            </div>
            <div class="card-body">
                <div class="text-center mb-4">
                    <img src="${firstArticle.image_url}" 
                         alt="Article image" 
                         class="img-fluid rounded shadow" 
                         style="max-height: 400px; width: auto; object-fit: cover;">
                </div>
                <div class="alert alert-info">
                    <h5>🎉 Image Display Working!</h5>
                    <p>This is exactly how images will appear in your news app once you have valid API keys.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
                    
                    require('fs').writeFileSync('../frontend/image-test.html', testHtml);
                    console.log('\n📁 Created image-test.html in frontend folder to demonstrate!');
                    console.log('   Open it at: http://localhost:3000/image-test.html');
                }
            }
        } else {
            console.log('❌ NewsData.io API failed:', result.error);
            console.log('Status:', result.status);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testNewsDataDirect();