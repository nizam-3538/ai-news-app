/**
 * Authentication routes for AI News Aggregator
 * Handles user registration and login with MongoDB storage
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

// In-memory store for OTPs. In production, use a persistent store like Redis.
const otpStore = {};

// Nodemailer transporter setup
// IMPORTANT: Replace with your own email service credentials.
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email from .env file
    pass: process.env.EMAIL_PASS, // Your email password or app password from .env file
  },
});

// Configuration
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * POST /auth/send-otp - Generate and send an OTP to the user's email
 * Request body:
 * - email: string (required)
 */
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  // Store the OTP and its expiration time
  otpStore[email] = { otp, expires };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for AI News Aggregator',
    text: `Your One-Time Password (OTP) is: ${otp}\n\nIt will expire in 10 minutes.\n`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * POST /auth/signup - Register new user
 * Request body:
 * - username: string (required, 3-50 chars)
 * - email: string (required, valid email)
 * - password: string (required, strong password)
 * - confirmPassword: string (required, must match password)
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword, otp } = req.body;
    
    // Validation
    const errors = [];
    
    if (!username || username.length < 3 || username.length > 50) {
      errors.push('Username must be between 3 and 50 characters');
    }
    
    if (!email || !isValidEmail(email)) {
      errors.push('Valid email address is required');
    }

    // OTP Validation
    const storedOtp = otpStore[email];
    if (!storedOtp) {
        errors.push('OTP not found. Please request a new one.');
    } else if (Date.now() > storedOtp.expires) {
        errors.push('OTP has expired. Please request a new one.');
        delete otpStore[email];
    } else if (otp !== storedOtp.otp) {
        errors.push('Invalid OTP.');
    }
    
    if (!password) {
      errors.push('Password is required');
    }
    
    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // If OTP is valid, delete it
    delete otpStore[email];
    
    console.log(`Signup attempt for email: ${email}, username: ${username}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        ok: false,
        error: `User with this ${field} already exists`
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Response (exclude password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
    
    console.log(`User created successfully: ${user.email}`);
    
    res.status(201).json({
      ok: true,
      message: 'User created successfully',
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Error in signup:', error.message);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        ok: false,
        error: `User with this ${field} already exists`
      });
    }
    
    next(error);
  }
});

/**
 * POST /auth/login - Authenticate user
 * Request body:
 * - email: string (required)
 * - password: string (required)
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Email and password are required'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: 'Valid email address is required'
      });
    }
    
    console.log(`Login attempt for email: ${email}`);
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Response (exclude password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    console.log(`User logged in successfully: ${user.email}`);
    
    res.json({
      ok: true,
      message: 'Login successful',
      user: userResponse,
      token
    });
    
  } catch (error) {
    console.error('Error in login:', error.message);
    next(error);
  }
});

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: 'Access token required'
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        ok: false,
        error: 'Invalid or expired token'
      });
    }
    
    req.user = user;
    next();
  });
}

/**
 * GET /auth/profile - Get user profile (requires authentication)
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    res.json({
      ok: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Error getting profile:', error.message);
    next(error);
  }
});

/**
 * POST /auth/verify - Verify token validity
 */
router.post('/verify', authenticateToken, (req, res) => {
  res.json({
    ok: true,
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username
    }
  });
});

/**
 * POST /auth/google - Google OAuth authentication
 * Request body:
 * - credential: string (JWT token from Google)
 */
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({
        ok: false,
        error: 'Google credential is required'
      });
    }
    
    // Decode JWT token (in production, verify signature with Google's public keys)
    let payload;
    try {
      const base64Payload = credential.split('.')[1];
      payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid Google credential format'
      });
    }
    
    const { sub: googleId, email, name, picture } = payload;
    
    if (!googleId || !email || !name) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid Google credential data'
      });
    }
    
    console.log(`Google OAuth attempt for email: ${email}`);
    
    // Check if user exists with Google ID
    let user = await User.findByGoogleId(googleId);
    
    if (user) {
      // Update last login
      user.lastLogin = new Date();
      if (picture && picture !== user.profilePicture) {
        user.profilePicture = picture;
      }
      await user.save();
    } else {
      // Check if user exists with same email (link accounts)
      user = await User.findByEmail(email);
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.authProvider = 'google';
        user.profilePicture = picture;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        let username = name.replace(/\s+/g, '_').toLowerCase();
        
        // Ensure username is unique
        let counter = 1;
        const baseUsername = username;
        while (await User.findByUsername(username)) {
          username = `${baseUsername}_${counter}`;
          counter++;
        }
        
        user = new User({
          username,
          email: email.toLowerCase(),
          googleId,
          profilePicture: picture,
          authProvider: 'google',
          isVerified: true, // Google emails are verified
          lastLogin: new Date()
        });
        
        await user.save();
      }
    }
    
    // Generate token
    const token = generateToken(user);
    
    console.log(`Google OAuth successful for: ${user.email}`);
    
    res.json({
      ok: true,
      message: 'Google authentication successful',
      user: user.toPublicJSON(),
      token
    });
    
  } catch (error) {
    console.error('Error in Google OAuth:', error.message);
    next(error);
  }
});
/**
 * POST /auth/refresh - Refresh JWT token
 */
router.post('/refresh', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    const newToken = generateToken(user);
    
    res.json({
      ok: true,
      token: newToken,
      user: user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Error refreshing token:', error.message);
    next(error);
  }
});

/**
 * GET /auth/favorites - Get user's favorite articles
 */
router.get('/favorites', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('favorites');
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    res.json({
      ok: true,
      favorites: user.favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)),
      count: user.favorites.length,
      limit: 50
    });
    
  } catch (error) {
    console.error('Error getting favorites:', error.message);
    next(error);
  }
});

/**
 * POST /auth/favorites - Add article to favorites
 * Request body:
 * - articleId: string (required)
 * - title: string (required) 
 * - link: string (required)
 * - source: string (required)
 */
router.post('/favorites', authenticateToken, async (req, res, next) => {
  try {
    const { articleId, title, link, source } = req.body;
    
    if (!articleId || !title || !link || !source) {
      return res.status(400).json({
        ok: false,
        error: 'Article ID, title, link, and source are required'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    const result = user.addFavorite({ id: articleId, title, link, source });
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: result.error
      });
    }
    
    await user.save();
    
    res.json({
      ok: true,
      message: 'Article added to favorites',
      favoritesCount: user.favorites.length
    });
    
  } catch (error) {
    console.error('Error adding favorite:', error.message);
    next(error);
  }
});

/**
 * DELETE /auth/favorites/:articleId - Remove article from favorites
 */
router.delete('/favorites/:articleId', authenticateToken, async (req, res, next) => {
  try {
    const { articleId } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    const result = user.removeFavorite(articleId);
    
    if (!result.success) {
      return res.status(404).json({
        ok: false,
        error: result.error
      });
    }
    
    await user.save();
    
    res.json({
      ok: true,
      message: 'Article removed from favorites',
      favoritesCount: user.favorites.length
    });
    
  } catch (error) {
    console.error('Error removing favorite:', error.message);
    next(error);
  }
});

/**
 * GET /auth/favorites/check/:articleId - Check if article is favorited
 */
router.get('/favorites/check/:articleId', authenticateToken, async (req, res, next) => {
  try {
    const { articleId } = req.params;
    
    const user = await User.findById(req.user.id).select('favorites');
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    const isFavorited = user.isFavorited(articleId);
    
    res.json({
      ok: true,
      isFavorited
    });
    
  } catch (error) {
    console.error('Error checking favorite:', error.message);
    next(error);
  }
});

// Export router and middleware
module.exports = router;
module.exports.authenticateToken = authenticateToken;