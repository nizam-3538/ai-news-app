/**
 * News routes for AI News Aggregator
 * Handles /news and /news/:id endpoints with RSS/NewsAPI fallback
 */

const express = require('express');
const { fetchAllFeeds } = require('../lib/rssClient');
const { safeFetch, normalizeDate, generateId, sanitizeHTML, extractSummary, getEnhancedContent, analyzeSentiment } = require('../lib/utils');

// Import authentication middleware
const { authenticateToken } = require('./auth');

const router = express.Router();

// NewsAPI configuration
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Additional News APIs configuration
const NEWS_APIS = {
  newsapi: {
    enabled: !!NEWSAPI_KEY,
    baseUrl: 'https://newsapi.org/v2',
    key: NEWSAPI_KEY,
    maxResults: 100
  },
  // GNews API
  gnews: {
    enabled: !!process.env.GNEWS_API_KEY,
    baseUrl: 'https://gnews.io/api/v4',
    key: process.env.GNEWS_API_KEY,
    maxResults: 50
  },
  // NewsData.io API
  newsdata: {
    enabled: !!process.env.NEWSDATA_API_KEY,
    baseUrl: 'https://newsdata.io/api/1',
    key: process.env.NEWSDATA_API_KEY,
    maxResults: 50
  }
};

/**
 * Fetch news from NewsAPI as fallback
 * @param {string} query - Search query (optional)
 * @param {number} pageSize - Number of articles to fetch
 * @returns {Promise<Array>} Normalized articles from NewsAPI
 */
async function fetchFromNewsAPI(query = '', pageSize = 50) {
  if (!NEWSAPI_KEY) {
    console.warn('NewsAPI key not configured, skipping NewsAPI fallback');
    return [];
  }
  
  try {
    const isSearch = query && query.trim().length > 0;
    
    // Always use 'everything' endpoint for maximum coverage
    // This endpoint allows searching through millions of articles from the last month
    const endpoint = 'everything';
    const params = {
      apiKey: NEWSAPI_KEY,
      pageSize: Math.min(pageSize, 100), // NewsAPI limit
      language: 'en',
      sortBy: isSearch ? 'relevancy' : 'publishedAt'
    };
    
    if (isSearch) {
      // Use the provided search query - this leverages the full power of /everything
      params.q = query;
      // For search queries, get articles from last 30 days for comprehensive results
      params.from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      console.log(`NewsAPI: Searching for "${query}" in last 30 days...`);
    } else {
      // If no query, search for general trending topics to get diverse content
      params.q = 'technology OR politics OR business OR science OR sports';
      // Use domains parameter to get high-quality sources
      params.domains = 'bbc.com,cnn.com,reuters.com,techcrunch.com,bloomberg.com,nytimes.com';
      // For general browsing, get articles from last 7 days for fresh content
      params.from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      console.log('NewsAPI: Fetching trending topics from quality sources...');
    }
    
    const url = `${NEWSAPI_BASE_URL}/${endpoint}`;
    const result = await safeFetch(url, { params });
    
    if (!result.success) {
      console.error('NewsAPI fetch failed:', result.error);
      return [];
    }
    
    const data = result.data;
    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn('No articles from NewsAPI response');
      return [];
    }
    
    // Normalize NewsAPI articles to our format
    const articles = await Promise.all(
      data.articles
        .filter(article => 
          article.title && 
          article.url && 
          article.title !== '[Removed]' &&
          article.description && 
          article.description !== '[Removed]'
        )
        .map(async article => {
          const sentiment = await analyzeSentiment(article.title);
          
          // Get enhanced content combining all available sources
          const enhancedContent = getEnhancedContent({
            content: article.content,
            description: article.description,
            summary: article.summary
          });
          
          return {
            id: generateId(article.url),
            title: article.title,
            link: article.url,
            summary: article.description || extractSummary(enhancedContent, 3),
            content: sanitizeHTML(enhancedContent || article.description || ''),
            publishedAt: normalizeDate(article.publishedAt),
            source: article.source?.name || 'NewsAPI',
            author: article.author || 'Unknown',
            sentiment: sentiment,
            categories: ['newsapi'],
            originalItem: {
              urlToImage: article.urlToImage,
              sourceId: article.source?.id
            }
          };
        })
    );
    
    console.log(`Fetched ${articles.length} articles from NewsAPI /everything endpoint (${isSearch ? 'search' : 'trending'})`);
    
    // For search queries, log additional info
    if (isSearch && data.totalResults) {
      console.log(`NewsAPI: Total ${data.totalResults} articles available for query "${query}"`);
    }
    return articles;
    
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error.message);
    return [];
  }
}

/**
 * Fetch news from GNews API
 * @param {string} query - Search query (optional)
 * @param {number} pageSize - Number of articles to fetch
 * @returns {Promise<Array>} Normalized articles from GNews
 */
async function fetchFromGNews(query = '', pageSize = 50) {
  const config = NEWS_APIS.gnews;
  if (!config.enabled) {
    console.warn('GNews API key not configured, skipping GNews API');
    return [];
  }
  
  try {
    const params = {
      token: config.key,
      max: Math.min(pageSize, config.maxResults),
      lang: 'en',
      sortby: 'publishedAt'
    };
    
    // Use search endpoint if query provided, otherwise top headlines
    const endpoint = query ? 'search' : 'top-headlines';
    if (query) {
      params.q = query;
    }
    
    const url = `${config.baseUrl}/${endpoint}`;
    const result = await safeFetch(url, { params });
    
    if (!result.success) {
      console.error('GNews API fetch failed:', result.error);
      return [];
    }
    
    const data = result.data;
    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn('No articles from GNews API response');
      return [];
    }
    
    // Normalize GNews articles to our format
    const articles = await Promise.all(
      data.articles
        .filter(article => article.title && article.url)
        .map(async article => {
          const sentiment = await analyzeSentiment(article.title);
          
          // Get enhanced content combining all available sources
          const enhancedContent = getEnhancedContent({
            content: article.content,
            description: article.description,
            summary: article.summary
          });
          
          return {
            id: generateId(article.url),
            title: article.title,
            link: article.url,
            summary: article.description || extractSummary(enhancedContent, 3) || 'No summary available',
            content: sanitizeHTML(enhancedContent || article.description || ''),
            publishedAt: normalizeDate(article.publishedAt),
            source: article.source?.name || 'GNews',
            author: 'Unknown', // GNews doesn't provide author info
            sentiment: sentiment,
            categories: ['gnews'],
            originalItem: {
              image: article.image,
              sourceName: article.source?.name,
              sourceUrl: article.source?.url
            }
          };
        })
    );
    
    console.log(`Fetched ${articles.length} articles from GNews API`);
    return articles;
    
  } catch (error) {
    console.error('Error fetching from GNews API:', error.message);
    return [];
  }
}

/**
 * Fetch news from NewsData.io API
 * @param {string} query - Search query (optional)
 * @param {number} pageSize - Number of articles to fetch
 * @returns {Promise<Array>} Normalized articles from NewsData.io
 */
async function fetchFromNewsData(query = '', pageSize = 50) {
  const config = NEWS_APIS.newsdata;
  if (!config.enabled) {
    console.warn('NewsData.io API key not configured, skipping NewsData.io API');
    return [];
  }
  
  try {
    const params = {
      apikey: config.key,
      size: Math.min(pageSize, config.maxResults),
      language: 'en',
      category: 'general'
    };
    
    // Use news endpoint (not latest which may not exist)
    const endpoint = 'news';
    if (query) {
      params.q = query;
      delete params.category; // Remove category when searching
    }
    
    const url = `${config.baseUrl}/${endpoint}`;
    const result = await safeFetch(url, { params });
    
    if (!result.success) {
      console.error('NewsData.io API fetch failed:', result.error);
      return [];
    }
    
    const data = result.data;
    if (!data.results || !Array.isArray(data.results)) {
      console.warn('No articles from NewsData.io API response');
      return [];
    }
    
    // Normalize NewsData.io articles to our format
    const articles = await Promise.all(
      data.results
        .filter(article => article.title && article.link)
        .map(async article => {
          const sentiment = await analyzeSentiment(article.title);
          
          // Get enhanced content combining all available sources  
          const enhancedContent = getEnhancedContent({
            content: article.content,
            description: article.description,
            summary: article.summary
          });
          
          return {
            id: generateId(article.link),
            title: article.title,
            link: article.link,
            summary: article.description || extractSummary(enhancedContent, 3) || 'No summary available',
            content: sanitizeHTML(enhancedContent || article.description || ''),
            publishedAt: normalizeDate(article.pubDate),
            source: article.source_id || 'NewsData.io',
            author: article.creator ? article.creator.join(', ') : 'Unknown',
            sentiment: sentiment,
            categories: article.category ? [article.category] : ['newsdata'],
            originalItem: {
              image_url: article.image_url,
              country: article.country,
              language: article.language,
              keywords: article.keywords
            }
          };
        })
    );
    
    console.log(`Fetched ${articles.length} articles from NewsData.io API`);
    return articles;
    
  } catch (error) {
    console.error('Error fetching from NewsData.io API:', error.message);
    return [];
  }
}

/**
 * Process an array of promises with limited concurrency
 * @param {Array} tasks - Array of async functions to execute
 * @param {number} maxConcurrency - Maximum number of concurrent tasks
 * @returns {Promise<Array>} Results of all tasks
 */
async function processWithConcurrencyLimit(tasks, maxConcurrency = 3) {
  const results = [];
  
  // Process tasks in batches
  for (let i = 0; i < tasks.length; i += maxConcurrency) {
    const batch = tasks.slice(i, i + maxConcurrency);
    console.log(`Processing API batch ${Math.floor(i/maxConcurrency) + 1} of ${Math.ceil(tasks.length/maxConcurrency)}...`);
    
    // Execute current batch concurrently
    const batchResults = await Promise.allSettled(batch.map(task => task()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Fetch news from all available APIs with limited concurrency
 * @param {string} query - Search query (optional)
 * @param {number} totalLimit - Total articles limit
 * @param {number} maxConcurrency - Maximum number of concurrent requests (default: from env or 3)
 * @returns {Promise<Array>} Combined and normalized articles from all sources
 */
async function fetchAllNews(query = '', totalLimit = 200, maxConcurrency = 4) {
  const tasks = [];
  
  const enabledApis = ['rss', ...Object.keys(NEWS_APIS).filter(api => NEWS_APIS[api].enabled)];
  const limitPerApi = Math.floor(totalLimit / enabledApis.length) || 20;

  // Add RSS feeds task
  tasks.push(() => fetchAllFeeds(undefined, 20, limitPerApi));

  // Add NewsAPI task if enabled
  if (NEWS_APIS.newsapi.enabled) {
    tasks.push(() => fetchFromNewsAPI(query, limitPerApi));
  }
  
  // Add GNews API task if enabled
  if (NEWS_APIS.gnews.enabled) {
    tasks.push(() => fetchFromGNews(query, limitPerApi));
  }
  
  // Add NewsData.io API task if enabled
  if (NEWS_APIS.newsdata.enabled) {
    tasks.push(() => fetchFromNewsData(query, limitPerApi));
  }
  
  // Execute all tasks with limited concurrency
  const results = await processWithConcurrencyLimit(tasks, maxConcurrency);
  
  // Combine and deduplicate articles
  const allArticles = [];
  const seenIds = new Set();
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (!seenIds.has(article.id)) {
          seenIds.add(article.id);
          allArticles.push(article);
        }
      }
    }
  }
  
  // Sort articles by published date (newest first)
  allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  return allArticles.slice(0, totalLimit);
}

// Define routes
/**
 * GET /news
 * Fetch top headlines or search results from multiple sources
 * Query parameters:
 * - q: Search query (optional)
 * - limit: Maximum number of articles to return (default: 100)
 * - sources: Comma-separated list of sources to include (optional)
 * - excludeSources: Comma-separated list of sources to exclude (optional)
 * - category: Category filter (optional)
 * - country: Country code for top headlines (optional)
 * - language: Language code (optional)
 * - sortBy: Sort order (publishedAt or relevancy, default: publishedAt)
 */
router.get('/', authenticateToken, async (req, res) => {
  const query = req.query.q || '';
  const limit = Math.min(parseInt(req.query.limit) || 200, 200);
  const sources = req.query.sources ? req.query.sources.split(',') : [];
  const excludeSources = req.query.excludeSources ? req.query.excludeSources.split(',') : [];
  const category = req.query.category || '';
  const country = req.query.country || 'us';
  const language = req.query.language || 'en';
  const sortBy = req.query.sortBy === 'relevancy' ? 'relevancy' : 'publishedAt';
  
  console.log(`Fetching news with query="${query}", limit=${limit}, sources=[${sources}], excludeSources=[${excludeSources}], category="${category}", country="${country}", language="${language}", sortBy="${sortBy}"`);
  
  try {
    // Fetch all news with limited concurrency
    let articles = await fetchAllNews(query, limit, 4);
    
    console.log(`Articles before filtering: ${articles.length}`);
    
    // Filter by sources if specified
    if (sources.length > 0) {
      articles = articles.filter(article => sources.includes(article.source));
      console.log(`After sources filter: ${articles.length}`);
    }
    
    // Filter by excluded sources if specified
    if (excludeSources.length > 0) {
      articles = articles.filter(article => !excludeSources.includes(article.source));
      console.log(`After excluded sources filter: ${articles.length}`);
    }
    
    // Filter by category if specified
    if (category) {
      articles = articles.filter(article => article.categories.includes(category));
      console.log(`After category filter: ${articles.length}`);
    }
    
    // Filter by country for top headlines (skip for RSS feeds as they don't have country info)
    if (country && !query && articles.length > 0 && articles[0].country) {
      articles = articles.filter(article => article.country === country);
      console.log(`After country filter (${country}):`, articles.length);
    }
    
    // Filter by language (skip for RSS feeds as they don't have language info)
    if (language && articles.length > 0 && articles[0].language) {
      articles = articles.filter(article => article.language === language);
      console.log(`After language filter (${language}):`, articles.length);
    }
    
    // Sort articles by the specified order
    if (sortBy === 'relevancy') {
      articles.sort((a, b) => b.relevancy - a.relevancy);
    } else {
      articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    // Limit the number of articles
    articles = articles.slice(0, limit);
    
    // Send response
    const page = 1;
    const pageSize = limit;
    const paginatedArticles = articles.slice((page - 1) * pageSize, page * pageSize);
    
    return res.json({
      success: true,
      data: paginatedArticles,
      meta: {
        total: articles.length,
        page,
        pageSize
      }
    });
    
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
});

/**
 * GET /news/sentiment
 * Analyze sentiment of top news headlines
 * Query parameters:
 * - category: Category filter (optional)
 * - country: Country code for top headlines (optional)
 * - language: Language code (optional)
 */
router.get('/sentiment', authenticateToken, async (req, res) => {
  const category = req.query.category || '';
  const country = req.query.country || 'us';
  const language = req.query.language || 'en';
  
  console.log(`Analyzing sentiment for news with category="${category}", country="${country}", language="${language}"`);
  
  try {
    // Fetch top headlines with limited sources
    let articles = await fetchAllNews('', 10, 3);
    
    // Filter by category if specified
    if (category) {
      articles = articles.filter(article => article.categories.includes(category));
    }
    
    // Filter by country
    if (country) {
      articles = articles.filter(article => article.country === country);
    }
    
    // Filter by language
    if (language) {
      articles = articles.filter(article => article.language === language);
    }
    
    // Analyze sentiment for each article
    const sentimentResults = await Promise.all(articles.map(async article => {
      try {
        const sentiment = await analyzeSentiment(article.title + ' ' + article.summary);
        return {
          id: article.id,
          title: article.title,
          link: article.link,
          sentiment: sentiment
        };
      } catch (error) {
        console.error('Error analyzing sentiment for article:', error.message);
        return null;
      }
    }));
    
    // Filter out failed sentiment analyses
    const successfulResults = sentimentResults.filter(result => result !== null);
    
    // Send response
    res.json({
      success: true,
      data: successfulResults
    });
    
  } catch (error) {
    console.error('Error fetching news for sentiment analysis:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news for sentiment analysis'
    });
  }
});

/**
 * GET /news/feeds
 * Fetch and aggregate news from RSS feeds
 * Query parameters:
 * - url: Comma-separated list of RSS feed URLs
 * - limit: Maximum number of articles to return from each feed (default: 10)
 */
router.get('/feeds', authenticateToken, async (req, res) => {
  const urls = req.query.url ? req.query.url.split(',') : [];
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  
  console.log(`Fetching news from feeds: ${urls.join(', ')}, limit=${limit}`);
  
  try {
    // Fetch and parse each RSS feed
    const feedResults = await Promise.all(urls.map(url => fetchAllFeeds(url, limit)));
    
    // Flatten and normalize feed articles
    const allArticles = feedResults.flat().map(article => ({
      id: generateId(article.link),
      title: article.title,
      link: article.link,
      summary: article.summary || extractSummary(article.content, 2),
      content: sanitizeHTML(article.content || ''),
      publishedAt: normalizeDate(article.publishedAt),
      source: article.source || 'RSS Feed',
      author: article.author || 'Unknown',
      categories: ['rss'],
      originalItem: {
        // Keep original feed URL for reference
        feedUrl: article.link
      }
    }));
    
    // Send response
    res.json({
      success: true,
      data: allArticles
    });
    
  } catch (error) {
    console.error('Error fetching news from feeds:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news from feeds'
    });
  }
});

/**
 * GET /news/:id
 * Fetch a specific news article by ID or index
 * Returns article data for frontend display
 */
router.get('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  
  console.log(`Fetching news article with ID: ${id}`);
  
  try {
    // Check if ID is a number (index-based lookup)
    if (!isNaN(id) && Number.isInteger(Number(id)) && Number(id) >= 0) {
      // Use index-based lookup for backward compatibility
      let articles = await fetchAllNews('', 200, 3);
      
      // If no articles from APIs, fallback to RSS feeds
      if (articles.length === 0) {
        console.log('No articles from APIs, falling back to RSS feeds for article lookup...');
        try {
          const rssArticles = await fetchAllFeeds();
          articles = rssArticles;
        } catch (rssError) {
          console.error('RSS fallback also failed:', rssError.message);
        }
      }
      
      // Use simple index-based lookup
      const articleIndex = parseInt(id);
      console.log(`Looking for article at index: ${articleIndex}`);
      
      if (isNaN(articleIndex) || articleIndex < 0 || articleIndex >= articles.length) {
        console.log(`Invalid article index: ${articleIndex}, total articles: ${articles.length}`);
        return res.status(404).json({
          success: false,
          error: 'Article not found'
        });
      }
      
      const article = articles[articleIndex];
      console.log(`Found article: ${article.title}`);
      
      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found'
        });
      }
      
      // Return the article data
      res.json({
        success: true,
        data: article
      });
    } else {
      // Use ID-based lookup
      let articles = await fetchAllNews('', 200, 3);
      
      // If no articles from APIs, fallback to RSS feeds
      if (articles.length === 0) {
        console.log('No articles from APIs, falling back to RSS feeds for article lookup...');
        try {
          const rssArticles = await fetchAllFeeds();
          articles = rssArticles;
        } catch (rssError) {
          console.error('RSS fallback also failed:', rssError.message);
        }
      }
      
      // Find article by ID
      const article = articles.find(a => a.id === id);
      
      if (!article) {
        console.log(`Article with ID ${id} not found`);
        return res.status(404).json({
          success: false,
          error: 'Article not found'
        });
      }
      
      console.log(`Found article: ${article.title}`);
      
      // Return the article data
      res.json({
        success: true,
        data: article
      });
    }
    
  } catch (error) {
    console.error('Error fetching news article:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news article'
    });
  }
});

module.exports = router;