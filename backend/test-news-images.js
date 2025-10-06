/**
 * Test if NewsData.io API is working and providing images
 */

async function testNewsWithImages() {
    try {
        console.log('🔍 Testing news endpoint for images...\n');
        
        const response = await fetch('http://localhost:3000/news?limit=5');
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Fetched ${data.data.length} articles`);
            
            let imagesFound = 0;
            data.data.forEach((article, index) => {
                console.log(`\n📄 Article ${index + 1}:`);
                console.log(`   Title: ${article.title.substring(0, 50)}...`);
                console.log(`   Source: ${article.source}`);
                
                // Check for images in originalItem
                if (article.originalItem) {
                    const hasImage = article.originalItem.urlToImage || 
                                   article.originalItem.image || 
                                   article.originalItem.image_url;
                    
                    if (hasImage) {
                        imagesFound++;
                        const imageUrl = article.originalItem.urlToImage || 
                                       article.originalItem.image || 
                                       article.originalItem.image_url;
                        console.log(`   🖼️  Image: ${imageUrl.substring(0, 60)}...`);
                    } else {
                        console.log(`   📷 Image: NOT FOUND`);
                    }
                    
                    console.log(`   🔍 OriginalItem:`, Object.keys(article.originalItem));
                } else {
                    console.log(`   📷 Image: NO ORIGINAL ITEM`);
                }
            });
            
            console.log(`\n📊 Summary:`);
            console.log(`   Articles with images: ${imagesFound}/${data.data.length}`);
            console.log(`   Image percentage: ${((imagesFound/data.data.length) * 100).toFixed(1)}%`);
            
            if (imagesFound > 0) {
                console.log(`\n🎉 SUCCESS: Images are working! The image display code should work.`);
            } else {
                console.log(`\n⚠️  No images found. This is likely because:`);
                console.log(`   1. APIs are not working (falling back to RSS)`);
                console.log(`   2. RSS feeds don't include images`);
                console.log(`   3. Need valid API keys for NewsAPI, GNews, or NewsData.io`);
            }
            
        } else {
            console.log(`❌ Failed to fetch news:`, data.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testNewsWithImages();