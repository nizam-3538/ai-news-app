/**
 * AI Analysis routes for AI News Aggregator
 * Handles /analyze and /auth endpoints
 */

const express = require('express');
const crypto = require('crypto');
const cache = require('../lib/cache');
const { analyzeSentiment } = require('../lib/utils');
const { getAIResponse } = require('../lib/ai');
const { sendVerificationEmail } = require('../lib/email'); // New email utility

// Mock user database functions for auth (replace with real DB calls)
const { findUserByEmail, createUser, findTempUserByEmail, saveTempUser, deleteTempUser } = require('../lib/userStore');
const bcrypt = require('bcryptjs');

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

/**
 * POST /auth/signup - Step 1: Initiate registration and send OTP
 */
router.post('/signup', async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ ok: false, error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
        }

        // Generate OTP and expiry
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store temporary user data
        await saveTempUser(email, { username, email, password: hashedPassword, otp, otpExpires });

        // Send verification email
        await sendVerificationEmail(email, otp);

        res.status(200).json({ ok: true, message: 'OTP sent to your email. Please verify to complete registration.' });

    } catch (error) {
        console.error('Error in POST /auth/signup:', error.message);
        next(error);
    }
});

/**
 * POST /auth/verify-otp - Step 2: Verify OTP and create user
 */
router.post('/verify-otp', async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ ok: false, error: 'Email and OTP are required' });
        }

        const tempUser = await findTempUserByEmail(email);

        if (!tempUser) {
            return res.status(400).json({ ok: false, error: 'Invalid request. Please sign up again.' });
        }

        if (tempUser.otp !== otp) {
            return res.status(400).json({ ok: false, error: 'Invalid OTP.' });
        }

        if (Date.now() > tempUser.otpExpires) {
            return res.status(400).json({ ok: false, error: 'OTP has expired. Please request a new one.' });
        }

        // OTP is valid, create permanent user
        const newUser = await createUser({
            username: tempUser.username,
            email: tempUser.email,
            password: tempUser.password,
        });

        // Clean up temporary data
        await deleteTempUser(email);

        // In a real app, you would generate a JWT here and log the user in.
        res.status(201).json({ ok: true, message: 'Account created successfully!', user: { id: newUser.id, username: newUser.username } });

    } catch (error) {
        console.error('Error in POST /auth/verify-otp:', error.message);
        next(error);
    }
});

/**
 * POST /auth/resend-otp - Resend OTP
 */
router.post('/resend-otp', async (req, res, next) => {
    try {
        const { email } = req.body;
        // This is a simplified version. A production app should have rate limiting.
        // For this, we'll just re-run the signup logic which overwrites the temp user and sends a new OTP.
        const tempUser = await findTempUserByEmail(email);
        if (!tempUser) return res.status(400).json({ ok: false, error: 'No pending registration found for this email.' });

        // Re-use the signup logic to generate and send a new OTP
        const { username, password } = tempUser; // We need the original password hash
        await router.post('/signup', { body: { username, email, password } }, res, next);

    } catch (error) {
        console.error('Error in POST /auth/resend-otp:', error.message);
        next(error);
    }
});

module.exports = router;