/**
 * Tests for news routes
 * Integration tests using Supertest and Jest
 */

const request = require('supertest');
const app = require('../server');
const { fetchAllFeeds } = require('../lib/rssClient');
const { safeFetch, analyzeSentiment } = require('../lib/utils');
const cache = require('../lib/cache');

// Mock external dependencies
jest.mock('../lib/rssClient', () => ({
  fetchAllFeeds: jest.fn(),
}));
jest.mock('../lib/utils.js', () => ({
  ...jest.requireActual('../lib/utils.js'),
  safeFetch: jest.fn(),
  analyzeSentiment: jest.fn(),
}));
jest.mock('../lib/cache');

describe('News Routes', () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetchAllFeeds.mockClear();
    safeFetch.mockClear();
    analyzeSentiment.mockClear();
    cache.loadArticles.mockClear();
    cache.saveArticles.mockClear();
    cache.findArticleById.mockClear();
    cache.getCacheStats.mockClear();
    cache.clearCache.mockClear();

    // Default mock implementations
    cache.loadArticles.mockResolvedValue({ articles: [], expired: true });
    analyzeSentiment.mockResolvedValue('neutral');
    safeFetch.mockResolvedValue({ success: true, data: { articles: [] } });
    fetchAllFeeds.mockResolvedValue([]);
  });

  describe('GET /news', () => {
    it('should return news articles from RSS and APIs', async () => {
      // Mock RSS feeds
      fetchAllFeeds.mockResolvedValue([
        { id: 'rss-1', title: 'RSS Article 1', link: 'https://example.com/rss1', source: 'RSS Source', publishedAt: new Date().toISOString(), categories: ['rss'] },
      ]);
      // Mock API fetches
      safeFetch.mockResolvedValue({
        success: true,
        data: {
          articles: [
            { title: 'API Article 1', url: 'https://example.com/api1', source: { name: 'API Source' }, publishedAt: new Date().toISOString(), description: 'summary' },
          ]
        }
      });
      process.env.NEWSAPI_KEY = 'test-key';

      const response = await request(app)
        .get('/news')
        .expect(200);
      
      expect(response.body.ok).toBe(true);
      expect(response.body.articles.length).toBe(2);
      expect(response.body.articles.some(a => a.id === 'rss-1')).toBe(true);
      expect(response.body.articles.some(a => a.source === 'API Source')).toBe(true);
      expect(cache.saveArticles).toHaveBeenCalled();
    });

    it('should limit articles when limit parameter provided', async () => {
      fetchAllFeeds.mockResolvedValue([
        { id: 'rss-1', title: 'RSS Article 1', link: 'https://example.com/rss1', publishedAt: new Date().toISOString(), categories: ['rss'] },
        { id: 'rss-2', title: 'RSS Article 2', link: 'https://example.com/rss2', publishedAt: new Date().toISOString(), categories: ['rss'] },
      ]);

      const response = await request(app)
        .get('/news?limit=1')
        .expect(200);
        
      expect(response.body.ok).toBe(true);
      expect(response.body.articles.length).toBe(1);
    });

    it('should use cache when available and not forced', async () => {
      const cachedArticles = [{ id: 'cached-1', title: 'Cached Article', link: 'https://example.com/cached1', sentiment: 'positive' }];
      cache.loadArticles.mockResolvedValue({ articles: cachedArticles, expired: false });

      const response = await request(app)
        .get('/news')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.articles[0].id).toBe('cached-1');
      expect(fetchAllFeeds).not.toHaveBeenCalled();
      expect(safeFetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh articles when force=true', async () => {
      const cachedArticles = [{ id: 'cached-1', title: 'Cached Article', link: 'https://example.com/cached1' }];
      cache.loadArticles.mockResolvedValue({ articles: cachedArticles, expired: false });
      fetchAllFeeds.mockResolvedValue([{ id: 'fresh-1', title: 'Fresh Article', link: 'https://example.com/fresh1', publishedAt: new Date().toISOString(), categories: ['fresh'] }]);

      const response = await request(app)
        .get('/news?force=true')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.articles.some(a => a.id === 'fresh-1')).toBe(true);
      expect(fetchAllFeeds).toHaveBeenCalled();
    });
  });

  describe('GET /news/:id', () => {
    it('should return specific article when valid ID provided', async () => {
      cache.findArticleById.mockResolvedValue({ id: 'test-article-1', title: 'Test Article 1', summary: 'summary' });
      analyzeSentiment.mockResolvedValue('positive');

      const response = await request(app)
        .get('/news/test-article-1')
        .expect(200);
        
      expect(response.body.ok).toBe(true);
      expect(response.body.article.id).toBe('test-article-1');
      expect(response.body.article.sentiment).toBe('positive');
    });

    it('should return 404 for non-existent article', async () => {
      cache.findArticleById.mockResolvedValue(null);

      const response = await request(app)
        .get('/news/non-existent-id')
        .expect(404);
        
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe('Article not found');
    });
  });

  describe('Cache Endpoints', () => {
    it('GET /news/cache/stats should return cache statistics', async () => {
      cache.getCacheStats.mockResolvedValue({ exists: true, articles: 10 });
      const response = await request(app)
        .get('/news/cache/stats')
        .expect(200);
        
      expect(response.body.ok).toBe(true);
      expect(response.body.cache.articles).toBe(10);
    });
    
    it('DELETE /news/cache should clear cache successfully', async () => {
      cache.clearCache.mockResolvedValue(true);
      const response = await request(app)
        .delete('/news/cache')
        .expect(200);
        
      expect(response.body.ok).toBe(true);
      expect(response.body.cleared).toBe(true);
    });
  });
});
