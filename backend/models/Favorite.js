/**
 * Favorite model for storing user favorite articles
 * Stores favorites in MongoDB with user association
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Article information
  articleId: {
    type: String,
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  link: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  summary: {
    type: String,
    maxlength: 2000
  },
  
  source: {
    type: String,
    maxlength: 100
  },
  
  author: {
    type: String,
    maxlength: 200
  },
  
  publishedAt: {
    type: Date
  },
  
  categories: [{
    type: String,
    maxlength: 50
  }],
  
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  
  // Metadata
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  tags: [{
    type: String,
    maxlength: 30
  }],
  
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  collection: 'favorites'
});

// Compound indexes for efficient queries
favoriteSchema.index({ userId: 1, articleId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, addedAt: -1 });
favoriteSchema.index({ userId: 1, source: 1 });
favoriteSchema.index({ userId: 1, sentiment: 1 });

// Instance methods
favoriteSchema.methods.toClientJSON = function() {
  return {
    id: this.articleId,
    title: this.title,
    link: this.link,
    summary: this.summary,
    source: this.source,
    author: this.author,
    publishedAt: this.publishedAt,
    categories: this.categories,
    sentiment: this.sentiment,
    addedAt: this.addedAt,
    tags: this.tags,
    notes: this.notes,
    _id: this._id
  };
};

// Static methods
favoriteSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 500, skip = 0, sort = { addedAt: -1 } } = options;
  return this.find({ userId })
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

favoriteSchema.statics.findByUserAndArticle = function(userId, articleId) {
  return this.findOne({ userId, articleId });
};

favoriteSchema.statics.countByUserId = function(userId) {
  return this.countDocuments({ userId });
};

favoriteSchema.statics.findByUserAndSource = function(userId, source) {
  return this.find({ 
    userId, 
    source: { $regex: source, $options: 'i' } 
  }).sort({ addedAt: -1 });
};

favoriteSchema.statics.searchByUser = function(userId, query) {
  return this.find({
    userId,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { summary: { $regex: query, $options: 'i' } },
      { source: { $regex: query, $options: 'i' } },
      { author: { $regex: query, $options: 'i' } }
    ]
  }).sort({ addedAt: -1 });
};

module.exports = mongoose.model('Favorite', favoriteSchema);