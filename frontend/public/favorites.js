/**
 * Favorites module for AI News Aggregator
 * Handles saving and managing user's favorite articles using dual storage:
 * - MongoDB (remote) for authenticated users
 * - localStorage (local) for all users as backup/offline support
 */

const Favorites = {
  // Storage key
  FAVORITES_KEY: 'ai_news_favorites',
  API_BASE_URL: 'https://ai-news-app-backend.vercel.app', // Update for production
  
  // Initialize favorites
  init() {
    console.log('⭐ Favorites module initialized with dual storage');
    this.syncWithServer();
  },
  
  /**
   * Get authentication token
   * @returns {string|null} JWT token or null
   */
  getAuthToken() {
    if (typeof Auth !== 'undefined' && Auth.getToken) {
      return Auth.getToken();
    }
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.token || null;
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  },
  
  /**
   * Make authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async apiRequest(url, options = {}) {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${this.API_BASE_URL}${url}`, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error.message);
      throw error;
    }
  },
  
  /**
   * Sync local favorites with server
   * @returns {Promise<void>}
   */
  async syncWithServer() {
    if (!this.isAuthenticated()) {
      console.log('User not authenticated, using localStorage only');
      return;
    }
    
    try {
      console.log('Syncing favorites with server...');
      
      // Get server favorites
      const serverResponse = await this.apiRequest('/favorites?limit=500');
      const serverFavorites = serverResponse.favorites || [];
      
      // Get local favorites
      const localFavorites = this.getLocalFavorites();
      
      // Merge favorites (server takes precedence)
      const mergedFavorites = this.mergeFavorites(localFavorites, serverFavorites);
      
      // Update local storage
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(mergedFavorites));
      
      console.log(`✅ Synced ${mergedFavorites.length} favorites with server`);
      
    } catch (error) {
      console.warn('Failed to sync with server, using local storage:', error.message);
    }
  },
  
  /**
   * Merge local and server favorites
   * @param {Array} localFavorites - Local favorites
   * @param {Array} serverFavorites - Server favorites
   * @returns {Array} Merged favorites
   */
  mergeFavorites(localFavorites, serverFavorites) {
    const merged = [...serverFavorites];
    const serverIds = new Set(serverFavorites.map(f => f.id));
    
    // Add local favorites not on server
    localFavorites.forEach(localFav => {
      if (!serverIds.has(localFav.id)) {
        merged.push(localFav);
      }
    });
    
    return merged.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  },
  
  /**
   * Get local favorites only
   * @returns {Array} Array of local favorite articles
   */
  getLocalFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '[]');
    } catch (error) {
      console.error('Error loading local favorites:', error);
      return [];
    }
  },
  
  /**
   * Get all favorites
   * @returns {Array} Array of favorite articles
   */
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '[]');
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  },
  
  /**
   * Add article to favorites
   * @param {Object} article - Article object to add
   * @returns {Promise<boolean>} Success status
   */
  async addFavorite(article) {
    try {
      if (!article || !article.id) {
        console.error('Invalid article object');
        return false;
      }
      
      const favorites = this.getFavorites();
      
      // Check if already favorited
      if (favorites.some(fav => fav.id === article.id)) {
        console.log('Article already in favorites:', article.id);
        return true;
      }
      
      // Check 500 favorites limit
      if (favorites.length >= 500) {
        console.warn('Maximum favorites limit reached (500)');
        this.showNotification('Maximum favorites limit reached (500)', 'warning');
        return false;
      }
      
      // Create favorite object with essential data
      const favoriteArticle = {
        id: article.id,
        title: article.title,
        link: article.link,
        summary: article.summary,
        source: article.source,
        author: article.author,
        publishedAt: article.publishedAt,
        categories: article.categories,
        sentiment: article.sentiment,
        addedAt: new Date().toISOString()
      };
      
      // Add to local storage immediately
      favorites.unshift(favoriteArticle);
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      
      // Try to add to server if authenticated
      if (this.isAuthenticated()) {
        try {
          await this.apiRequest('/favorites', {
            method: 'POST',
            body: JSON.stringify({
              articleId: favoriteArticle.id,
              title: favoriteArticle.title,
              link: favoriteArticle.link,
              summary: favoriteArticle.summary,
              source: favoriteArticle.source,
              author: favoriteArticle.author,
              publishedAt: favoriteArticle.publishedAt,
              categories: favoriteArticle.categories,
              sentiment: favoriteArticle.sentiment
            })
          });
          console.log('✅ Article synced to server:', article.title);
        } catch (serverError) {
          console.warn('Failed to sync to server, keeping local copy:', serverError.message);
        }
      }
      
      console.log('✅ Article added to favorites:', article.title);
      this.showNotification('Article added to favorites', 'success');
      
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      this.showNotification('Failed to add to favorites', 'error');
      return false;
    }
  },
  
  /**
   * Remove article from favorites
   * @param {string} articleId - Article ID to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeFavorite(articleId) {
    try {
      const favorites = this.getFavorites();
      const initialLength = favorites.length;
      
      const updatedFavorites = favorites.filter(fav => fav.id !== articleId);
      
      if (updatedFavorites.length === initialLength) {
        console.log('Article not found in favorites:', articleId);
        return false;
      }
      
      // Remove from local storage immediately
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(updatedFavorites));
      
      // Try to remove from server if authenticated
      if (this.isAuthenticated()) {
        try {
          await this.apiRequest(`/favorites/${encodeURIComponent(articleId)}`, {
            method: 'DELETE'
          });
          console.log('✅ Article removed from server:', articleId);
        } catch (serverError) {
          console.warn('Failed to remove from server, keeping local change:', serverError.message);
        }
      }
      
      console.log('✅ Article removed from favorites:', articleId);
      this.showNotification('Article removed from favorites', 'success');
      
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      this.showNotification('Failed to remove from favorites', 'error');
      return false;
    }
  },
  
  /**
   * Check if article is favorited
   * @param {string} articleId - Article ID to check
   * @returns {boolean} True if favorited
   */
  isFavorited(articleId) {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.id === articleId);
  },
  
  /**
   * Get favorite by ID
   * @param {string} articleId - Article ID
   * @returns {Object|null} Favorite article or null
   */
  getFavorite(articleId) {
    const favorites = this.getFavorites();
    return favorites.find(fav => fav.id === articleId) || null;
  },
  
  /**
   * Clear all favorites
   * @returns {Promise<boolean>} Success status
   */
  async clearFavorites() {
    try {
      // Clear local storage immediately
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify([]));
      
      // Try to clear server favorites if authenticated
      if (this.isAuthenticated()) {
        try {
          await this.apiRequest('/favorites', {
            method: 'DELETE'
          });
          console.log('✅ Server favorites cleared');
        } catch (serverError) {
          console.warn('Failed to clear server favorites:', serverError.message);
        }
      }
      
      console.log('✅ All favorites cleared');
      this.showNotification('All favorites cleared', 'success');
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      this.showNotification('Failed to clear favorites', 'error');
      return false;
    }
  },
  
  /**
   * Get favorites count
   * @returns {number} Number of favorites
   */
  getCount() {
    return this.getFavorites().length;
  },
  
  /**
   * Get favorites by source
   * @param {string} source - Source name
   * @returns {Array} Filtered favorites
   */
  getFavoritesBySource(source) {
    const favorites = this.getFavorites();
    return favorites.filter(fav => 
      fav.source && fav.source.toLowerCase().includes(source.toLowerCase())
    );
  },
  
  /**
   * Get favorites by category
   * @param {string} category - Category name
   * @returns {Array} Filtered favorites
   */
  getFavoritesByCategory(category) {
    const favorites = this.getFavorites();
    return favorites.filter(fav => 
      fav.categories && fav.categories.some(cat => 
        cat.toLowerCase().includes(category.toLowerCase())
      )
    );
  },
  
  /**
   * Search favorites
   * @param {string} query - Search query
   * @returns {Array} Filtered favorites
   */
  searchFavorites(query) {
    if (!query.trim()) return this.getFavorites();
    
    const favorites = this.getFavorites();
    const searchTerm = query.toLowerCase();
    
    return favorites.filter(fav => 
      fav.title.toLowerCase().includes(searchTerm) ||
      fav.summary.toLowerCase().includes(searchTerm) ||
      fav.source.toLowerCase().includes(searchTerm) ||
      (fav.author && fav.author.toLowerCase().includes(searchTerm))
    );
  },
  
  /**
   * Export favorites to JSON
   * @returns {string} JSON string of favorites
   */
  exportFavorites() {
    try {
      const favorites = this.getFavorites();
      const exportData = {
        favorites,
        exportedAt: new Date().toISOString(),
        count: favorites.length
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting favorites:', error);
      return null;
    }
  },
  
  /**
   * Import favorites from JSON
   * @param {string} jsonData - JSON string to import
   * @param {boolean} merge - Whether to merge with existing favorites
   * @returns {boolean} Success status
   */
  importFavorites(jsonData, merge = true) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.favorites || !Array.isArray(importData.favorites)) {
        throw new Error('Invalid import format');
      }
      
      let existingFavorites = merge ? this.getFavorites() : [];
      const newFavorites = importData.favorites;
      
      // Merge and deduplicate
      const allFavorites = [...existingFavorites];
      let addedCount = 0;
      
      newFavorites.forEach(newFav => {
        if (!allFavorites.some(existing => existing.id === newFav.id)) {
          allFavorites.push(newFav);
          addedCount++;
        }
      });
      
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(allFavorites));
      
      console.log(`✅ Imported ${addedCount} new favorites`);
      this.showNotification(`Imported ${addedCount} new favorites`, 'success');
      
      return true;
    } catch (error) {
      console.error('Error importing favorites:', error);
      this.showNotification('Failed to import favorites', 'error');
      return false;
    }
  },
  
  /**
   * Render favorites in container
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Rendering options
   */
  renderFavorites(container, options = {}) {
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
      
    if (!containerElement) {
      console.error('Favorites container not found');
      return;
    }
    
    const favorites = this.getFavorites();
    const {
      showEmpty = true,
      limit = null,
      showRemoveButton = true,
      onRemove = null,
      onClick = null
    } = options;
    
    // Clear container
    containerElement.innerHTML = '';
    
    if (favorites.length === 0 && showEmpty) {
      containerElement.innerHTML = `
        <div class="text-center" style="padding: var(--spacing-2xl);">
          <div style="font-size: 4rem; margin-bottom: var(--spacing-lg);">⭐</div>
          <h3>No favorites yet</h3>
          <p class="text-secondary">Save interesting articles to read them later.</p>
        </div>
      `;
      return;
    }
    
    const favoritesToShow = limit ? favorites.slice(0, limit) : favorites;
    
    favoritesToShow.forEach(favorite => {
      const favoriteCard = this.createFavoriteCard(favorite, {
        showRemoveButton,
        onRemove,
        onClick
      });
      containerElement.appendChild(favoriteCard);
    });
  },
  
  /**
   * Create favorite card element
   * @param {Object} favorite - Favorite article
   * @param {Object} options - Card options
   * @returns {HTMLElement} Card element
   */
  createFavoriteCard(favorite, options = {}) {
    const { showRemoveButton = true, onRemove = null, onClick = null } = options;
    
    const card = document.createElement('article');
    card.className = 'card news-card';
    card.setAttribute('role', 'listitem');
    
    // Format date
    const addedDate = new Date(favorite.addedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const publishedDate = new Date(favorite.publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    card.innerHTML = `
      <div class="card-header">
        ${favorite.sentiment ? `
          <div class="sentiment-badge sentiment-${favorite.sentiment}">
            ${favorite.sentiment.charAt(0).toUpperCase() + favorite.sentiment.slice(1)}
          </div>
        ` : ''}
        
        ${showRemoveButton ? `
          <button class="favorite-btn active" aria-label="Remove from favorites" data-id="${favorite.id}">
            ⭐
          </button>
        ` : ''}
      </div>
      
      <div class="card-content">
        <h3 class="card-title">${this.escapeHtml(favorite.title)}</h3>
        
        <div class="card-meta">
          <span>📰 ${this.escapeHtml(favorite.source)}</span>
          <span>📅 ${publishedDate}</span>
          <span>⭐ Added ${addedDate}</span>
        </div>
        
        <p class="card-content">${this.escapeHtml(favorite.summary || 'No summary available.')}</p>
        
        ${favorite.categories && favorite.categories.length > 0 ? `
          <div style="margin-top: var(--spacing-sm);">
            ${favorite.categories.map(cat => `
              <span class="btn btn-sm" style="padding: 2px 8px; margin-right: 4px; background-color: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; font-size: var(--font-size-xs);">
                ${this.escapeHtml(cat)}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="card-footer">
        <a href="news.html?id=${favorite.id}" class="btn btn-primary btn-sm">Read Article</a>
        <a href="${favorite.link}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Original</a>
      </div>
    `;
    
    // Add click handler for card
    if (onClick) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.favorite-btn') && !e.target.closest('.btn')) {
          onClick(favorite);
        }
      });
    }
    
    // Add remove button handler
    if (showRemoveButton) {
      const removeBtn = card.querySelector('.favorite-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (onRemove) {
          onRemove(favorite.id);
        } else {
          this.removeFavorite(favorite.id);
          card.remove();
        }
      });
    }
    
    return card;
  },
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type = 'info') {
    // Try to use existing notification system
    const statusMessages = document.getElementById('statusMessages');
    if (statusMessages) {
      statusMessages.className = `alert alert-${type}`;
      statusMessages.textContent = message;
      statusMessages.classList.remove('hidden');
      
      setTimeout(() => {
        statusMessages.classList.add('hidden');
      }, 3000);
      return;
    }
    
    // Fallback: create temporary notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  },
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  /**
   * Get favorites statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const favorites = this.getFavorites();
    const sources = new Map();
    const categories = new Map();
    let totalSentiment = { positive: 0, negative: 0, neutral: 0 };

    favorites.forEach(fav => {
      // Count sources
      if (fav.source) {
        sources.set(fav.source, (sources.get(fav.source) || 0) + 1);
      }

      // Count categories
      if (fav.categories) {
        fav.categories.forEach(cat => {
          categories.set(cat, (categories.get(cat) || 0) + 1);
        });
      }

      // Count sentiment
      if (fav.sentiment && fav.sentiment.match(/^(positive|negative|neutral)$/)) {
        totalSentiment[fav.sentiment]++;
      }
    });

    return {
      total: favorites.length,
      sources: [...sources.entries()].sort((a, b) => b[1] - a[1]),
      categories: [...categories.entries()].sort((a, b) => b[1] - a[1]),
      sentiment: totalSentiment,
      oldest: favorites.length > 0 ? favorites[favorites.length - 1].addedAt : null,
      newest: favorites.length > 0 ? favorites[0].addedAt : null
    };
  }
};

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Favorites.init());
} else {
  Favorites.init();
}

// Add CSS animations if not present
if (!document.querySelector('#favorites-animations')) {
  const style = document.createElement('style');
  style.id = 'favorites-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Make Favorites available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Favorites;
} else {
  window.Favorites = Favorites;
}