/**
 * AI Analysis routes for AI News Aggregator
 * Handles /analyze endpoint
 */

const express = require('express');
const cache = require('../lib/cache');
const { analyzeSentiment } = require('../lib/utils');
const { getAIResponse } = require('../lib/ai');

const router = express.Router();

/**
 * POST /analyze - Analyze article with AI
 */
router.post('/', async (req, res, next) => {
  try {
    const { articleId, text, question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Question is required' });
    }

    if (!articleId && !text) {
      return res.status(400).json({ ok: false, error: 'Either articleId or text must be provided' });
    }

    let articleText = text;
    if (articleId) {
      const article = await cache.findArticleById(articleId);
      if (!article) {
        return res.status(404).json({ ok: false, error: 'Article not found' });
      }
      articleText = `Title: ${article.title}\n\nContent: ${article.content}`;
    }

    if (!articleText) {
      return res.status(400).json({ ok: false, error: 'No content to analyze' });
    }

    const analysisResult = await getAIResponse(articleText, question);
    const sentiment = await analyzeSentiment(articleText);

    res.json({
      ok: true,
      ...analysisResult,
      sentiment,
      meta: {
        ...analysisResult.meta,
        articleId: articleId || null,
      },
    });
  } catch (error) {
    console.error('Error in POST /analyze:', error.message);
    next(error);
  }
});

// Note: The /summarize and /health endpoints are kept for now but could be refactored.

module.exports = router;