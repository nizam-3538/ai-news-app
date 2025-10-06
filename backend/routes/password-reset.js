/**
 * Password reset routes for AI News Aggregator
 * Handles forgot password and reset password functionality
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// In-memory token storage (use Redis in production)
const resetTokens = new Map();

// Configuration
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate secure reset token
 * @returns {string} Reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send password reset email (mock implementation)
 * In production, integrate with email service like SendGrid, SES, etc.
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} username - Username
 */
async function sendResetEmail(email, token, _username) {
  // Mock email sending - replace with actual email service
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password.html?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log('📧 Password Reset Email (Mock):');
  console.log(`To: ${email}`);
  console.log('Subject: Reset Your Password - AI News Aggregator');
  console.log(`Reset Link: ${resetLink}`);
  console.log('This link expires in 1 hour.');
  
  // In production, use email service:
  /*
  const emailData = {
    to: email,
    subject: 'Reset Your Password - AI News Aggregator',
    html: `
      <h2>Reset Your Password</h2>
      <p>Hi ${username},</p>
      <p>You requested to reset your password. Click the link below to create a new password:</p>
      <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };
  
  await emailService.send(emailData);
  */
}

/**
 * POST /forgot-password - Send password reset email
 * Request body:
 * - email: string (required)
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Email is required'
      });
    }
    
    console.log(`Password reset requested for: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration attacks
    // Don't reveal whether the email exists or not
    const response = {
      ok: true,
      message: 'If an account with this email exists, you will receive a reset link shortly.'
    };
    
    if (user) {
      // Generate reset token
      const resetToken = generateResetToken();
      const expiryTime = Date.now() + TOKEN_EXPIRY;
      
      // Store token (use database in production)
      resetTokens.set(resetToken, {
        userId: user._id,
        email: user.email,
        expiresAt: expiryTime
      });
      
      // Send reset email
      try {
        await sendResetEmail(user.email, resetToken, user.username);
        console.log(`✅ Reset email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Don't expose email sending errors to user
      }
      
      // Clean up expired tokens
      setTimeout(() => {
        resetTokens.delete(resetToken);
      }, TOKEN_EXPIRY);
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error in forgot-password:', error.message);
    next(error);
  }
});

/**
 * POST /reset-password - Reset password with token
 * Request body:
 * - token: string (required)
 * - password: string (required)
 * - confirmPassword: string (required)
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    // Validation
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Reset token is required'
      });
    }
    
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Password is required'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        ok: false,
        error: 'Passwords do not match'
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        ok: false,
        error: 'Password must be at least 8 characters long'
      });
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        ok: false,
        error: 'Password must contain uppercase, lowercase, and number'
      });
    }
    
    console.log(`Password reset attempt with token: ${token.substring(0, 8)}...`);
    
    // Check token validity
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid or expired reset token'
      });
    }
    
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({
        ok: false,
        error: 'Reset token has expired'
      });
    }
    
    // Find user
    const user = await User.findById(tokenData.userId);
    
    if (!user) {
      resetTokens.delete(token);
      return res.status(400).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Update user password
    user.password = hashedPassword;
    user.lastLogin = null; // Force re-login
    await user.save();
    
    // Delete used token
    resetTokens.delete(token);
    
    console.log(`✅ Password reset successful for: ${user.email}`);
    
    res.json({
      ok: true,
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('Error in reset-password:', error.message);
    next(error);
  }
});

/**
 * GET /validate-reset-token - Validate reset token
 * Query parameters:
 * - token: string (required)
 */
router.get('/validate-reset-token', async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        ok: false,
        error: 'Token is required'
      });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData || Date.now() > tokenData.expiresAt) {
      return res.json({
        ok: false,
        valid: false,
        error: 'Invalid or expired token'
      });
    }
    
    res.json({
      ok: true,
      valid: true,
      email: tokenData.email
    });
    
  } catch (error) {
    console.error('Error validating reset token:', error.message);
    next(error);
  }
});

/**
 * GET /reset-tokens/stats - Get reset token statistics (admin only)
 */
router.get('/reset-tokens/stats', async (req, res) => {
  // This would need admin authentication in production
  const now = Date.now();
  let activeTokens = 0;
  let expiredTokens = 0;
  
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      expiredTokens++;
      resetTokens.delete(token); // Clean up expired tokens
    } else {
      activeTokens++;
    }
  }
  
  res.json({
    ok: true,
    stats: {
      activeTokens,
      expiredTokens,
      totalGenerated: activeTokens + expiredTokens
    }
  });
});

module.exports = router;