/**
 * Test script to check article image data
 */

async function checkArticleImages() {
    try {
        console.log('🔍 Checking article data structure...\n');
        
        // Fetch first few articles
        for (let i = 0; i < 3; i++) {
            console.log(`📄 Article ${i}:`);
            
            const response = await fetch(`http://localhost:3000/news/${i}`);
            const data = await response.json();
            
            if (data.success) {
                const article = data.data;
                console.log(`Title: ${article.title.substring(0, 50)}...`);
                console.log(`Source: ${article.source}`);
                console.log(`Original Item:`, article.originalItem ? 'EXISTS' : 'NOT EXISTS');
                
                if (article.originalItem) {
                    console.log(`  - urlToImage: ${article.originalItem.urlToImage || 'NOT FOUND'}`);
                    console.log(`  - image: ${article.originalItem.image || 'NOT FOUND'}`);
                    console.log(`  - image_url: ${article.originalItem.image_url || 'NOT FOUND'}`);
                    console.log(`  Full originalItem:`, JSON.stringify(article.originalItem, null, 2));
                } else {
                    console.log('  No originalItem field found');
                }
                
                console.log('─'.repeat(80));
            } else {
                console.log(`❌ Failed to fetch article ${i}:`, data.error);
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
checkArticleImages();