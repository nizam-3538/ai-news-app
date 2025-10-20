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

/**
 * POST /analyze/translate - Translate article content
 */
router.post('/translate', async (req, res, next) => {
  try {
    const { text, language } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Text to translate is required' });
    }
    if (!language || typeof language !== 'string' || language.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Target language is required' });
    }

    // Construct a very specific prompt for the AI
    const question = `Translate the following article text to ${language}.
Your response MUST be a valid JSON object with three keys: "title", "summary", and "content".
Do not include any other text, explanations, or markdown formatting like \`\`\`json.
The JSON object should look exactly like this: {"title": "...", "summary": "...", "content": "..."}

---TEXT---
${text}`;

    // We pass an empty string for the first argument to getAIResponse as the full context is in the question.
    const analysisResult = await getAIResponse('', question);

    // Attempt to parse the AI's answer to ensure it's valid JSON
    let translatedContent;
    try {
      // Attempt to extract JSON from potentially malformed AI response
      const jsonMatch = analysisResult.answer.match(/```json\n([\s\S]*?)\n```/);
      const rawJson = jsonMatch ? jsonMatch[1] : analysisResult.answer;
      translatedContent = JSON.parse(rawJson);

      // Basic validation of the JSON structure
      if (!translatedContent || typeof translatedContent.title === 'undefined' || typeof translatedContent.summary === 'undefined' || typeof translatedContent.content === 'undefined') {
        throw new Error('Translated JSON is missing required fields.');
      }

      res.json({
        ok: true,
        translation: translatedContent,
        meta: analysisResult.meta,
      });
    } catch (parseError) {
      console.error('AI did not return valid JSON for translation or parsing failed:', analysisResult.answer, parseError);
      throw new Error('Translation service failed to return a valid format or AI response was malformed.');
    }
  } catch (error) {
    console.error('Error in POST /analyze/translate:', error.message);
    next(error);
  }
});

// Note: The /summarize and /health endpoints are kept for now but could be refactored.

module.exports = router;