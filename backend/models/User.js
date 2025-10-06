/**
 * User model for AI News Aggregator
 * MongoDB schema for user authentication and profile data
 */

const mongoose = require('mongoose');

// User schema definition
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  
  password: {
    type: String,
    required: function() {
      // Password is only required for non-OAuth users
      return !this.googleId;
    },
    minlength: [8, 'Password must be at least 8 characters long']
    // Note: Password validation is handled in the auth route with bcrypt
  },
  
  // OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values to not conflict with unique constraint
  },
  
  profilePicture: {
    type: String,
    default: null
  },
  
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  
  // User metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  // User preferences (for future features)
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    
    language: {
      type: String,
      default: 'en'
    },
    
    notifications: {
      email: {
        type: Boolean,
        default: false
      },
      
      browser: {
        type: Boolean,
        default: true
      }
    },
    
    // News preferences
    favoriteCategories: [{
      type: String,
      enum: ['general', 'business', 'technology', 'science', 'health', 'sports', 'entertainment']
    }],
    
    favoriteSources: [String]
  },
  
  // User favorites (limited to 50 per user)
  favorites: [{
    articleId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    link: {
      type: String,
      required: true
    },
    source: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false // Email verification (future feature)
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'favorites.articleId': 1 });

// Virtual for user's full display name (future feature)
userSchema.virtual('displayName').get(function() {
  return this.username;
});

// Instance methods
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    profilePicture: this.profilePicture,
    authProvider: this.authProvider,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
    preferences: this.preferences,
    isVerified: this.isVerified,
    favoritesCount: this.favorites.length
  };
};

// Add favorite article (with 50 limit)
userSchema.methods.addFavorite = function(article) {
  // Check if already favorited
  const existingIndex = this.favorites.findIndex(fav => fav.articleId === article.id);
  if (existingIndex !== -1) {
    return { success: false, error: 'Article already in favorites' };
  }
  
  // Check 50 limit
  if (this.favorites.length >= 50) {
    return { success: false, error: 'Favorites limit reached (50 articles maximum)' };
  }
  
  // Add to favorites
  this.favorites.unshift({
    articleId: article.id,
    title: article.title,
    link: article.link,
    source: article.source,
    addedAt: new Date()
  });
  
  return { success: true };
};

// Remove favorite article
userSchema.methods.removeFavorite = function(articleId) {
  const index = this.favorites.findIndex(fav => fav.articleId === articleId);
  if (index === -1) {
    return { success: false, error: 'Article not found in favorites' };
  }
  
  this.favorites.splice(index, 1);
  return { success: true };
};

// Check if article is favorited
userSchema.methods.isFavorited = function(articleId) {
  return this.favorites.some(fav => fav.articleId === articleId);
};

// Static methods
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId: googleId });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Update lastLogin timestamp when user logs in
  if (this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  
  next();
});

// Error handling middleware
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    // Handle duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    const err = new Error(`User with this ${field} already exists`);
    err.status = 409;
    next(err);
  } else {
    next(error);
  }
});

// Model creation
const User = mongoose.model('User', userSchema);

module.exports = User;