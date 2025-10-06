/**
 * Favorites routes for AI News Aggregator
 * Handles CRUD operations for user favorites in MongoDB
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const Favorite = require('../models/Favorite');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        ok: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

/**
 * GET /favorites - Get user's favorites
 * Query parameters:
 * - limit: number of favorites (default: 100, max: 500)
 * - skip: pagination offset
 * - source: filter by source
 * - search: search query
 * - sentiment: filter by sentiment
 */
router.get('/', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('skip').optional().isInt({ min: 0 }).toInt(),
  query('source').optional().isLength({ max: 100 }),
  query('search').optional().isLength({ max: 200 }),
  query('sentiment').optional().isIn(['positive', 'negative', 'neutral'])
], async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      limit = 100,
      skip = 0,
      source,
      search,
      sentiment
    } = req.query;

    // If no user authenticated, return empty response
    if (!req.user) {
      return res.json({
        ok: true,
        favorites: [],
        meta: {
          total: 0,
          limit,
          skip,
          authenticated: false
        }
      });
    }

    console.log(`GET /favorites - user: ${req.user.id}, limit: ${limit}, skip: ${skip}`);

    let query_obj = { userId: req.user.id };

    // Apply filters
    if (source) {
      query_obj.source = { $regex: source, $options: 'i' };
    }

    if (sentiment) {
      query_obj.sentiment = sentiment;
    }

    if (search) {
      query_obj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Get favorites and total count
    const [favorites, total] = await Promise.all([
      Favorite.find(query_obj)
        .sort({ addedAt: -1 })
        .limit(limit)
        .skip(skip),
      Favorite.countDocuments(query_obj)
    ]);

    // Convert to client format
    const clientFavorites = favorites.map(fav => fav.toClientJSON());

    res.json({
      ok: true,
      favorites: clientFavorites,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
        filters: { source, search, sentiment },
        authenticated: true
      }
    });

  } catch (error) {
    console.error('Error in GET /favorites:', error.message);
    next(error);
  }
});

/**
 * POST /favorites - Add article to favorites
 */
router.post('/', authenticateToken, [
  body('articleId').notEmpty().isLength({ max: 200 }),
  body('title').notEmpty().isLength({ max: 500 }),
  body('link').notEmpty().isURL().isLength({ max: 1000 }),
  body('summary').optional().isLength({ max: 2000 }),
  body('source').optional().isLength({ max: 100 }),
  body('author').optional().isLength({ max: 200 }),
  body('publishedAt').optional().isISO8601().toDate(),
  body('categories').optional().isArray({ max: 10 }),
  body('categories.*').optional().isLength({ max: 50 }),
  body('sentiment').optional().isIn(['positive', 'negative', 'neutral']),
  body('tags').optional().isArray({ max: 10 }),
  body('tags.*').optional().isLength({ max: 30 }),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      articleId,
      title,
      link,
      summary = '',
      source = '',
      author = '',
      publishedAt,
      categories = [],
      sentiment = 'neutral',
      tags = [],
      notes = ''
    } = req.body;

    console.log(`POST /favorites - user: ${req.user.id}, article: ${articleId}`);

    // Check user's current favorites count
    const currentCount = await Favorite.countByUserId(req.user.id);
    if (currentCount >= 500) {
      return res.status(400).json({
        ok: false,
        error: 'Maximum favorites limit reached (500 per user)',
        currentCount
      });
    }

    // Check if already favorited
    const existing = await Favorite.findByUserAndArticle(req.user.id, articleId);
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: 'Article already in favorites',
        favorite: existing.toClientJSON()
      });
    }

    // Create new favorite
    const favorite = new Favorite({
      userId: req.user.id,
      articleId,
      title,
      link,
      summary,
      source,
      author,
      publishedAt,
      categories,
      sentiment,
      tags,
      notes
    });

    await favorite.save();

    console.log(`✅ Article added to favorites: ${title}`);

    res.status(201).json({
      ok: true,
      message: 'Article added to favorites',
      favorite: favorite.toClientJSON()
    });

  } catch (error) {
    console.error('Error in POST /favorites:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: 'Article already in favorites'
      });
    }
    next(error);
  }
});

/**
 * DELETE /favorites/:articleId - Remove article from favorites
 */
router.delete('/:articleId', authenticateToken, async (req, res, next) => {
  try {
    const { articleId } = req.params;

    if (!articleId) {
      return res.status(400).json({
        ok: false,
        error: 'Article ID is required'
      });
    }

    console.log(`DELETE /favorites/${articleId} - user: ${req.user.id}`);

    const result = await Favorite.deleteOne({
      userId: req.user.id,
      articleId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Favorite not found'
      });
    }

    console.log(`✅ Article removed from favorites: ${articleId}`);

    res.json({
      ok: true,
      message: 'Article removed from favorites'
    });

  } catch (error) {
    console.error('Error in DELETE /favorites/:articleId:', error.message);
    next(error);
  }
});

/**
 * GET /favorites/check/:articleId - Check if article is favorited
 */
router.get('/check/:articleId', optionalAuth, async (req, res, next) => {
  try {
    const { articleId } = req.params;

    if (!articleId) {
      return res.status(400).json({
        ok: false,
        error: 'Article ID is required'
      });
    }

    // If no user authenticated, return not favorited
    if (!req.user) {
      return res.json({
        ok: true,
        favorited: false,
        authenticated: false
      });
    }

    const favorite = await Favorite.findByUserAndArticle(req.user.id, articleId);

    res.json({
      ok: true,
      favorited: !!favorite,
      authenticated: true,
      favorite: favorite ? favorite.toClientJSON() : null
    });

  } catch (error) {
    console.error('Error in GET /favorites/check/:articleId:', error.message);
    next(error);
  }
});

/**
 * GET /favorites/stats - Get user's favorites statistics
 */
router.get('/stats', optionalAuth, async (req, res, next) => {
  try {
    // If no user authenticated, return empty stats
    if (!req.user) {
      return res.json({
        ok: true,
        stats: {
          total: 0,
          sources: [],
          categories: [],
          sentiment: { positive: 0, negative: 0, neutral: 0 }
        },
        authenticated: false
      });
    }

    console.log(`GET /favorites/stats - user: ${req.user.id}`);

    // Get aggregated statistics
    const [
      total,
      sourceStats,
      categoryStats,
      sentimentStats
    ] = await Promise.all([
      Favorite.countByUserId(req.user.id),
      Favorite.aggregate([
        { $match: { userId: req.user.id } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Favorite.aggregate([
        { $match: { userId: req.user.id } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Favorite.aggregate([
        { $match: { userId: req.user.id } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ])
    ]);

    // Format sentiment stats
    const sentiment = { positive: 0, negative: 0, neutral: 0 };
    sentimentStats.forEach(stat => {
      sentiment[stat._id] = stat.count;
    });

    res.json({
      ok: true,
      stats: {
        total,
        sources: sourceStats.map(s => ({ name: s._id, count: s.count })),
        categories: categoryStats.map(c => ({ name: c._id, count: c.count })),
        sentiment
      },
      authenticated: true
    });

  } catch (error) {
    console.error('Error in GET /favorites/stats:', error.message);
    next(error);
  }
});

/**
 * DELETE /favorites - Clear all favorites
 */
router.delete('/', authenticateToken, async (req, res, next) => {
  try {
    console.log(`DELETE /favorites - user: ${req.user.id}`);

    const result = await Favorite.deleteMany({ userId: req.user.id });

    console.log(`✅ Cleared ${result.deletedCount} favorites`);

    res.json({
      ok: true,
      message: 'All favorites cleared',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error in DELETE /favorites:', error.message);
    next(error);
  }
});

module.exports = router;