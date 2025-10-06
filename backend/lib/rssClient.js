/**
 * RSS Feed Client for AI News Aggregator
 * Fetches and parses RSS feeds from multiple sources concurrently
 * Normalizes article data and handles deduplication
 */

const Parser = require('rss-parser');
const { dedupeByUrl, normalizeDate, sanitizeHTML, extractSummary, getEnhancedContent, analyzeSentiment } = require('./utils');

// Initialize RSS parser with custom options
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AI-News-Aggregator/1.0.0'
  }
});

// Default RSS feeds configuration - Enhanced with more sources
const DEFAULT_FEEDS = [
  // General News Sources
  {
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    source: 'BBC News',
    category: 'general'
  },
  // {
  //   url: 'https://rss.cnn.com/rss/edition.rss',
  //   source: 'CNN',
  //   category: 'general'
  // },
  // {
  //   url: 'https://feeds.reuters.com/reuters/topNews',
  //   source: 'Reuters',
  //   category: 'general'
  // },
  {
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    source: 'Wall Street Journal',
    category: 'business'
  },
  
  // Technology Sources
  {
    url: 'https://feeds.feedburner.com/TechCrunch',
    source: 'TechCrunch',
    category: 'technology'
  },
  {
    url: 'https://www.wired.com/feed/rss',
    source: 'Wired',
    category: 'technology'
  },
  {
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    source: 'Ars Technica',
    category: 'technology'
  },
  {
    url: 'https://feeds.feedburner.com/venturebeat/SZYF',
    source: 'VentureBeat',
    category: 'technology'
  },
  
  // Business & Finance
  {
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    source: 'Bloomberg Markets',
    category: 'business'
  },
  // {
  //   url: 'https://feeds.forbes.com/forbesmagazine/feed2.xml',
  //   source: 'Forbes',
  //   category: 'business'
  // },
  {
    url: 'https://feeds.feedburner.com/entrepreneur/latest',
    source: 'Entrepreneur',
    category: 'business'
  },
  
  // Science & Health
  // {
  //   url: 'https://feeds.nationalgeographic.com/ng/news',
  //   source: 'National Geographic',
  //   category: 'science'
  // },
  // {
  //   url: 'https://rss.cnn.com/rss/edition_health.rss',
  //   source: 'CNN Health',
  //   category: 'health'
  // },
  {
    url: 'https://feeds.feedburner.com/sciencedaily',
    source: 'Science Daily',
    category: 'science'
  },
  
  // Sports
  {
    url: 'http://feeds.bbci.co.uk/sport/rss.xml',
    source: 'BBC Sport',
    category: 'sports'
  },
  // {
  //   url: 'https://rss.cnn.com/rss/edition_sport.rss',
  //   source: 'CNN Sports',
  //   category: 'sports'
  // },
  
  // Entertainment
  // {
  //   url: 'https://rss.cnn.com/rss/edition_entertainment.rss',
  //   source: 'CNN Entertainment',
  //   category: 'entertainment'
  // },
  {
    url: 'https://feeds.feedburner.com/thr/news',
    source: 'The Hollywood Reporter',
    category: 'entertainment'
  },
  
  // International News
  {
    url: 'https://feeds.feedburner.com/ndtvnews-top-stories',
    source: 'NDTV',
    category: 'general'
  },
  // {
  //   url: 'https://feeds.feedburner.com/timesofindia-toistories',
  //   source: 'Times of India',
  //   category: 'general'
  // },
  // {
  //   url: 'https://feeds.feedburner.com/france24-en-top-stories',
  //   source: 'France 24',
  //   category: 'general'
  // },
  // {
  //   url: 'https://feeds.feedburner.com/AJEnglish',
  //   source: 'Al Jazeera English',
  //   category: 'general'
  // }
];

/**
 * Fetch and parse a single RSS feed
 * @param {Object} feedConfig - Feed configuration object
 * @param {number} maxItems - Maximum items to fetch per feed
 * @returns {Promise<Array>} Normalized articles from the feed
 */
async function fetchSingleFeed(feedConfig, maxItems = 20) {
  const { url, source, category = 'general' } = feedConfig;
  
  try {
    console.log(`Fetching RSS feed: ${source} (${url})`);
    
    const feed = await parser.parseURL(url);
    
    if (!feed.items || !Array.isArray(feed.items)) {
      console.warn(`No items found in feed: ${source}`);
      return [];
    }
    
    // Normalize and limit articles with sentiment analysis
    const articles = await Promise.all(
      feed.items
        .slice(0, maxItems)
        .map(item => normalizeArticle(item, source, category))
    );
    
    // Filter out null results
    const validArticles = articles.filter(article => article !== null);
    
    console.log(`Successfully fetched ${validArticles.length} articles from ${source}`);
    return validArticles;
    
  } catch (error) {
    console.error(`Error fetching RSS feed ${source}:`, error.message);
    return [];
  }
}

/**
 * Generate unique ID for article
 * @param {string} link - Article URL
 * @param {string} title - Article title
 * @returns {string} Unique article ID
 */
function generateArticleId(link, title) {
  // Create a simple hash from URL and title
  const content = (link + title).toLowerCase();
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Normalize RSS item to standard article format
 * @param {Object} item - Raw RSS item
 * @param {string} source - Source name
 * @param {string} category - Article category
 * @returns {Promise<Object|null>} Normalized article object
 */
/* eslint-disable security/detect-object-injection */
async function normalizeArticle(item, source, category) {
  try {
    // Extract basic fields
    const title = item.title?.trim();
    const link = item.link?.trim();
    
    if (!title || !link) {
      return null; // Skip articles without essential fields
    }
    
    // Extract and clean content
    const rawContent = item.content || item['content:encoded'] || item.summary || item.description || '';
    
    // Get enhanced content combining all available sources
    const enhancedContent = getEnhancedContent({
      content: item.content || item['content:encoded'],
      description: item.description,
      summary: item.summary
    });
    
    const cleanContent = sanitizeHTML(enhancedContent || rawContent);
    const summary = extractSummary(cleanContent, 3);
    
    // Extract publication date
    const publishedAt = normalizeDate(item.pubDate || item.isoDate || item.date);
    
    // Extract author information
    const author = item.creator || item.author || item['dc:creator'] || 'Unknown';
    
    // Extract categories/tags
    const categories = [];
    if (item.categories && Array.isArray(item.categories)) {
      categories.push(...item.categories.map(cat => typeof cat === 'string' ? cat : cat._));
    }
    categories.push(category);
    
    // Generate unique ID for the article
    const id = generateArticleId(link, title);
    
    // Analyze sentiment of the headline
    const sentiment = await analyzeSentiment(title);
    
    return {
      id, // Add unique ID
      title,
      link,
      summary,
      content: cleanContent,
      publishedAt,
      source,
      author,
      sentiment: sentiment, // Add sentiment analysis
      categories: [...new Set(categories)], // Remove duplicates
      originalItem: {
        guid: item.guid,
        enclosure: item.enclosure
      }
    };
    
  } catch (error) {
    console.error('Error normalizing article:', error.message);
    return null;
  }
}
/* eslint-enable security/detect-object-injection */

/**
 * Process an array of promises with limited concurrency
 * @param {Array} tasks - Array of async functions to execute
 * @param {number} maxConcurrency - Maximum number of concurrent tasks
 * @returns {Promise<Array>} Results of all tasks
 */
async function processWithConcurrencyLimit(tasks, maxConcurrency = 5) {
  const results = [];
  
  // Process tasks in batches
  for (let i = 0; i < tasks.length; i += maxConcurrency) {
    const batch = tasks.slice(i, i + maxConcurrency);
    console.log(`Processing batch ${Math.floor(i/maxConcurrency) + 1} of ${Math.ceil(tasks.length/maxConcurrency)}...`);
    
    // Execute current batch concurrently
    const batchResults = await Promise.allSettled(batch.map(task => task()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Fetch articles from multiple RSS feeds with limited concurrency
 * @param {Array} feeds - Array of feed configurations (optional, uses defaults if not provided)
 * @param {number} maxItemsPerFeed - Maximum items per feed
 * @param {number} totalLimit - Total articles limit across all feeds
 * @param {number} maxConcurrency - Maximum number of concurrent requests (default: from env or 5)
 * @returns {Promise<Array>} Merged and deduplicated articles sorted by date
 */
async function fetchArticles(feeds = DEFAULT_FEEDS, maxItemsPerFeed = 20, totalLimit = 100, maxConcurrency = 5) {
  // Normalize maxConcurrency from environment variable
  maxConcurrency = Math.max(1, Math.min(10, parseInt(maxConcurrency, 10) || 5));
  
  console.log(`Fetching articles from ${feeds.length} feeds with max ${maxItemsPerFeed} items per feed...`);
  
  // Fetch all feeds concurrently with limited concurrency
  const feedResults = await processWithConcurrencyLimit(
    feeds.map(feedConfig => () => fetchSingleFeed(feedConfig, maxItemsPerFeed)),
    maxConcurrency
  );
  
  // Extract and merge successful results
  const allArticles = [];
  for (const result of feedResults) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.warn('Error in feed result:', result.reason);
    }
  }
  
  console.log(`Fetched ${allArticles.length} articles from all feeds`);
  
  // Deduplicate articles by URL
  const uniqueArticles = dedupeByUrl(allArticles);
  
  // Sort articles by publication date (newest first)
  uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  // Apply total limit
  return uniqueArticles.slice(0, totalLimit);
}

// Exported functions for external usage
module.exports = {
  fetchSingleFeed,
  fetchArticles,
  fetchAllFeeds: fetchArticles, // Alias for backward compatibility
  DEFAULT_FEEDS
};