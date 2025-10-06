# GNews API Integration Guide

## 🎯 Overview
GNews API has been successfully integrated into your AI News Aggregator! GNews provides real-time news articles from thousands of sources worldwide with excellent coverage and reliability.

## 🔧 Setup Instructions

### 1. Get Your Free GNews API Key

1. **Visit GNews.io**: Go to [https://gnews.io/](https://gnews.io/)
2. **Sign Up**: Create a free account
3. **Get API Key**: Navigate to your dashboard and copy your API key
4. **Free Plan Limits**: 
   - 100 requests per day
   - Up to 10 articles per request
   - Perfect for development and small applications

### 2. Configure Your Environment

1. **Open your `.env` file** in the backend directory
2. **Replace the placeholder** with your actual API key:
   ```env
   # GNews API - Get free API key from https://gnews.io/
   GNEWS_API_KEY=your_actual_gnews_api_key_here
   ```

### 3. Test the Integration

Run the test script to verify everything is working:

```bash
cd backend
node test-gnews.js
```

If successful, you should see articles being fetched from GNews API.

## 🚀 Features & Benefits

### What GNews API Provides:
- ✅ **Real-time News**: Latest articles from thousands of sources
- ✅ **Global Coverage**: News from multiple countries and languages
- ✅ **High Quality**: Reliable sources with good content quality
- ✅ **Search Capability**: Both top headlines and search functionality
- ✅ **Rich Metadata**: Source information, publication dates, images

### Integration Benefits:
- 📈 **More Articles**: Increases your total article pool
- 🌍 **Better Coverage**: More diverse news sources
- 🔄 **Automatic Fallback**: Part of the multi-API strategy
- ⚡ **Fast Response**: Quick API response times
- 🎯 **Relevant Content**: Good article quality and relevance

## 🔧 Technical Details

### API Endpoints Used:
- **Top Headlines**: `https://gnews.io/api/v4/top-headlines`
- **Search**: `https://gnews.io/api/v4/search`

### Parameters:
- `token`: Your API key
- `max`: Number of articles (1-10 for free plan)
- `lang`: Language code (en for English)
- `sortby`: Sort order (publishedAt for newest first)
- `q`: Search query (for search endpoint)

### Article Normalization:
GNews articles are automatically normalized to match your app's format:
```javascript
{
  id: "generated_unique_id",
  title: "Article Title",
  link: "https://article-url.com",
  summary: "Article description",
  content: "Article content",
  publishedAt: "2024-01-01T00:00:00Z",
  source: "Source Name",
  author: "Unknown", // GNews doesn't provide author
  categories: ["gnews"],
  originalItem: {
    image: "image_url",
    sourceName: "source_name",
    sourceUrl: "source_website"
  }
}
```

## 📊 API Usage Optimization

### Load Balancing:
Your app now distributes requests across 4 APIs:
- NewsAPI (25% of requests)
- Guardian API (25% of requests) 
- MediaStack API (25% of requests)
- GNews API (25% of requests)

### Concurrency Control:
- Maximum 3 concurrent API requests
- Automatic error handling and fallback
- RSS feeds as final fallback if all APIs fail

## 🔍 Monitoring & Debugging

### Check API Status:
```bash
# Test all APIs including GNews
cd backend
node debug-apis.js
```

### View Logs:
The app logs GNews API activity:
- `✅ Fetched X articles from GNews API` (success)
- `⚠️ GNews API key not configured` (not set up)
- `❌ GNews API fetch failed` (API error)

### Common Issues:

1. **"API key not configured"**
   - Solution: Add your API key to `.env` file

2. **"GNews API fetch failed"**
   - Check if API key is valid
   - Verify you haven't exceeded rate limits
   - Check internet connection

3. **"No articles from GNews API response"**
   - API might be down temporarily
   - Try again in a few minutes

## 🎉 You're All Set!

Once configured, GNews API will automatically:
- ✅ Provide additional news articles
- ✅ Improve content diversity
- ✅ Enhance overall user experience
- ✅ Work seamlessly with existing APIs

Your news aggregator now has access to even more high-quality news sources!

## 📞 Support

- **GNews Documentation**: [https://gnews.io/docs/](https://gnews.io/docs/)
- **Rate Limits**: Check your dashboard at gnews.io
- **Upgrade Plans**: Available for higher limits if needed

---

**Happy News Aggregating! 📰🚀**