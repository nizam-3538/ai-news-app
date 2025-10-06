/**
 * Tests for analyze routes
 * Integration tests for the /analyze endpoint.
 */

const request = require('supertest');
const app = require('../server');
const { getAIResponse } = require('../lib/ai');
const { analyzeSentiment } = require('../lib/utils');

// Mock dependencies
jest.mock('../lib/ai.js');
jest.mock('../lib/utils.js', () => ({
  ...jest.requireActual('../lib/utils.js'),
  analyzeSentiment: jest.fn(),
}));
jest.mock('../lib/cache', () => ({
  findArticleById: jest.fn((id) => {
    if (id === 'test-article-1') {
      return Promise.resolve({
        id: 'test-article-1',
        title: 'Test Title',
        content: 'Test content.',
      });
    }
    return Promise.resolve(null);
  }),
}));

describe('POST /analyze', () => {
  beforeEach(() => {
    getAIResponse.mockClear();
    analyzeSentiment.mockClear();
  });

  it('should return a successful analysis', async () => {
    getAIResponse.mockResolvedValue({
      answer: 'This is the AI answer.',
      model: 'mock-ai',
      grounded: true,
    });
    analyzeSentiment.mockResolvedValue('positive');

    const response = await request(app)
      .post('/analyze')
      .send({ articleId: 'test-article-1', question: 'What is this about?' })
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.answer).toBe('This is the AI answer.');
    expect(response.body.sentiment).toBe('positive');
    expect(response.body.grounded).toBe(true);
    expect(getAIResponse).toHaveBeenCalledWith('Title: Test Title\n\nContent: Test content.', 'What is this about?');
  });

  it('should return a fallback analysis when AI fails', async () => {
    getAIResponse.mockResolvedValue({
      answer: '[FALLBACK] This is a fallback answer.',
      model: 'extractive-fallback',
      grounded: false,
      meta: { note: 'extractive fallback' },
    });
    analyzeSentiment.mockResolvedValue('neutral');

    const response = await request(app)
      .post('/analyze')
      .send({ articleId: 'test-article-1', question: 'What is this about?' })
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.grounded).toBe(false);
    expect(response.body.answer).toContain('[FALLBACK]');
    expect(response.body.meta.note).toBe('extractive fallback');
  });

  it('should return 404 for a non-existent article', async () => {
    const response = await request(app)
      .post('/analyze')
      .send({ articleId: 'not-found', question: 'What is this about?' })
      .expect(404);

    expect(response.body.ok).toBe(false);
    expect(response.body.error).toBe('Article not found');
  });

  it('should return 400 if question is missing', async () => {
    const response = await request(app)
      .post('/analyze')
      .send({ articleId: 'test-article-1' })
      .expect(400);

    expect(response.body.error).toBe('Question is required');
  });
});