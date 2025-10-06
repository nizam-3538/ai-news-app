/**
 * File-based cache system for AI News Aggregator
 * Provides atomic writes, TTL management, and safe file operations
 */

const fs = require('fs').promises;
const path = require('path');

// Cache configuration
const CACHE_DIR = path.join(__dirname, '..', 'data');
const ARTICLES_FILE = path.join(CACHE_DIR, 'articles.json');
const TEMP_SUFFIX = '.tmp';
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      console.log('Created cache directory:', CACHE_DIR);
    } else {
      throw error;
    }
  }
}

/**
 * Atomic file write using temporary file and rename
 * @param {string} filePath - Target file path
 * @param {string} data - Data to write
 */
async function atomicWrite(filePath, data) {
  const tempPath = filePath + TEMP_SUFFIX;
  
  try {
    // Write to temporary file
    await fs.writeFile(tempPath, data, 'utf8');
    
    // Atomic rename (move temp file to target)
    await fs.rename(tempPath, filePath);
    
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Safe file read with error handling
 * @param {string} filePath - File path to read
 * @returns {Promise<Object|null>} Parsed JSON data or null if file doesn't exist
 */
async function safeRead(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    console.error('Error reading file:', filePath, error.message);
    return null;
  }
}

/**
 * Check if cached data is expired
 * @param {number} timestamp - Cache timestamp
 * @param {number} ttl - Time to live in milliseconds
 * @returns {boolean} True if expired
 */
function isExpired(timestamp, ttl = DEFAULT_TTL) {
  return Date.now() - timestamp > ttl;
}

/**
 * Save articles to cache with metadata
 * @param {Array} articles - Articles to cache
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
async function saveArticles(articles, metadata = {}) {
  try {
    await ensureCacheDir();
    
    const cacheData = {
      timestamp: Date.now(),
      count: articles.length,
      metadata: {
        sources: [...new Set(articles.map(a => a.source))],
        categories: [...new Set(articles.flatMap(a => a.categories || []))],
        ...metadata
      },
      articles
    };
    
    const jsonData = JSON.stringify(cacheData, null, 2);
    await atomicWrite(ARTICLES_FILE, jsonData);
    
    console.log(`Cached ${articles.length} articles successfully`);
    return true;
    
  } catch (error) {
    console.error('Error saving articles to cache:', error.message);
    return false;
  }
}

/**
 * Load articles from cache
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<Object>} Cache data with articles and metadata
 */
async function loadArticles(maxAge = DEFAULT_TTL) {
  try {
    const cacheData = await safeRead(ARTICLES_FILE);
    
    if (!cacheData) {
      return { articles: [], fromCache: false, expired: false };
    }
    
    const expired = isExpired(cacheData.timestamp, maxAge);
    
    return {
      articles: cacheData.articles || [],
      metadata: cacheData.metadata || {},
      timestamp: cacheData.timestamp,
      fromCache: true,
      expired
    };
    
  } catch (error) {
    console.error('Error loading articles from cache:', error.message);
    return { articles: [], fromCache: false, expired: true };
  }
}

/**
 * Find article by ID in cache
 * @param {string} articleId - Article ID to find
 * @returns {Promise<Object|null>} Article object or null if not found
 */
async function findArticleById(articleId) {
  try {
    const cacheData = await loadArticles(24 * 60 * 60 * 1000); // 24 hour max age for individual articles
    
    if (!cacheData.articles || cacheData.articles.length === 0) {
      return null;
    }
    
    const article = cacheData.articles.find(a => a.id === articleId);
    return article || null;
    
  } catch (error) {
    console.error('Error finding article by ID:', error.message);
    return null;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  try {
    const cacheData = await safeRead(ARTICLES_FILE);
    
    if (!cacheData) {
      return {
        exists: false,
        articles: 0,
        age: 0,
        expired: true
      };
    }
    
    const age = Date.now() - cacheData.timestamp;
    
    return {
      exists: true,
      articles: cacheData.articles?.length || 0,
      age,
      expired: isExpired(cacheData.timestamp),
      sources: cacheData.metadata?.sources || [],
      categories: cacheData.metadata?.categories || [],
      lastUpdated: new Date(cacheData.timestamp).toISOString()
    };
    
  } catch (error) {
    console.error('Error getting cache stats:', error.message);
    return {
      exists: false,
      articles: 0,
      age: 0,
      expired: true,
      error: error.message
    };
  }
}

/**
 * Clear cache (delete articles file)
 * @returns {Promise<boolean>} Success status
 */
async function clearCache() {
  try {
    await fs.unlink(ARTICLES_FILE);
    console.log('Cache cleared successfully');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Cache already empty');
      return true;
    }
    console.error('Error clearing cache:', error.message);
    return false;
  }
}

/**
 * Purge expired entries (placeholder for future enhancement)
 * Currently removes entire cache if expired
 * @returns {Promise<boolean>} Success status
 */
async function purgeExpired() {
  try {
    const stats = await getCacheStats();
    
    if (stats.expired) {
      await clearCache();
      console.log('Purged expired cache');
      return true;
    }
    
    console.log('Cache not expired, no purge needed');
    return true;
    
  } catch (error) {
    console.error('Error purging expired cache:', error.message);
    return false;
  }
}

module.exports = {
  saveArticles,
  loadArticles,
  findArticleById,
  getCacheStats,
  clearCache,
  purgeExpired,
  isExpired
};