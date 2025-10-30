/**
 * Main application script for AI News Aggregator
 * Coordinates all modules and handles core application logic
 */

const App = {
  // Configuration
  API_BASE_URL: 'https://ai-news-app-backend.vercel.app',
  
  // State
  articles: [],
  loading: false,
  showingFavorites: false,
  
  // Initialize application
  init() {
    console.log('🚀 AI News Aggregator application initialized');
    
    // Check authentication first
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }
    
    // Setup event listeners (theme is handled in index.html)
    this.setupEventListeners();
    
    // Load initial data
    this.loadNews();
    
    // Setup auto-refresh
    this.setupAutoRefresh();
  },
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadNews(true));
    }
    
    // Favorites toggle - check for both possible IDs
    const favoritesToggle = document.getElementById('favoritesToggle') || document.getElementById('favoritesToggleBottom');
    if (favoritesToggle) {
      favoritesToggle.addEventListener('click', this.toggleFavorites.bind(this));
    }
    
    // Retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadNews(true));
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }
  },
  
  /**
   * Toggle theme between light and dark
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeText = document.getElementById('themeText');
    if (themeText) {
      themeText.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
    
    console.log(`🎨 Theme changed to ${newTheme}`);
  },
  
  /**
   * Load news from API
   * @param {boolean} force - Force refresh (ignore cache)
   */
  async loadNews(force = false) {
    console.log("loadNews() started");
    
    // Check authentication
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    if (this.loading) return;

    this.setLoading(true);
    this.hideError();

    try {
      const timestamp = new Date().getTime();
      const url = `${this.API_BASE_URL}/news?_=${timestamp}${force ? '&force=true' : ''}`;
      console.log('Fetching news from:', url);
      
      // Add authorization header if user is authenticated
      const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
      const headers = {};
      
      if (currentUser && currentUser.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      
      const response = await fetch(url, { headers });
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          if (typeof Auth !== 'undefined') {
            Auth.logout();
          }
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load news');
      }

      this.articles = [];
      data.data.forEach((article, index) => {
        const cleanArticle = {
          id: article.id, // Use the ID directly from the backend
          title: article.title || 'Untitled',
          source: article.source || 'Unknown',
          author: article.author || 'Unknown',
          summary: article.description || 'No summary available',
          link: article.link || article.url || '#',
          publishedAt: article.publishedAt || new Date().toISOString(),
          sentiment: article.sentiment || 'neutral',
          categories: Array.isArray(article.categories)
            ? article.categories
            : (typeof article.categories === 'string'
                ? article.categories.split(',')
                : []),
          content: article.content || ''
        };
        console.log('Using backend article ID:', cleanArticle.id, 'for article:', cleanArticle.title);
        this.articles.push(cleanArticle);
      });

      console.log(`📰 Loaded ${this.articles.length} articles`, this.articles);

      if (typeof Search !== 'undefined') {
        Search.indexArticles(this.articles);
      }

      this.displayArticles(this.articles);
      this.updateRefreshButton();

    } catch (error) {
      console.error('Error loading news:', error);
      this.showError(error.message || 'Failed to load news');
    } finally {
      this.setLoading(false);
    }
  },
  
  /**
   * Display articles in the grid
   * @param {Array} articles - Articles to display
   */
  displayArticles(articles) {
    const newsList = document.getElementById('newsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!newsList) return;
    
    // Clear existing content
    newsList.innerHTML = '';
    
    if (!articles || articles.length === 0) {
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
      return;
    }
    
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    
    // Render article cards with index
    articles.forEach((article, index) => {
      const card = this.renderNewsCard(article, { index });
      newsList.appendChild(card);
    });
  },
  
  /**
   * Render a news card
   * @param {Object} article - Article data
   * @param {Object} options - Rendering options
   * @returns {HTMLElement} Card element
   */
  renderNewsCard(article, options = {}) {
    const { highlightMatches = null, index = 0 } = options;

    const card = document.createElement('article');
    card.className = 'card news-card h-100';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-article-id', article.id);
    card.setAttribute('data-article-index', index);

    // Format date
    const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get sentiment info
    const sentiment = article.sentiment || 'neutral';
    let sentimentClass, sentimentText;
    switch (sentiment) {
      case 'positive':
        sentimentClass = 'sentiment-positive';
        sentimentText = 'Positive';
        break;
      case 'negative':
        sentimentClass = 'sentiment-negative';
        sentimentText = 'Negative';
        break;
      default:
        sentimentClass = 'sentiment-neutral';
        sentimentText = 'Neutral';
    }

    // Highlight matches if provided
    const title = highlightMatches && highlightMatches.title 
      ? this.highlightText(article.title, highlightMatches.title)
      : this.escapeHtml(article.title);
      
    const summary = highlightMatches && highlightMatches.summary
      ? this.highlightText(article.summary, highlightMatches.summary)
      : this.escapeHtml(article.summary || 'No summary available.');
    
    card.innerHTML = `
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <span class="badge ${sentimentClass} d-flex align-items-center gap-1">
          <span class="sentiment-indicator"></span>
          ${sentimentText}
        </span>
        
        <button class="favorite-btn btn btn-sm ${this.isFavorited(article.id) ? 'active text-danger' : 'text-muted'}" 
                aria-label="Toggle favorite" 
                data-article-id="${article.id}">
          <i class="bi bi-heart${this.isFavorited(article.id) ? '-fill' : ''}"></i>
        </button>
      </div>
      
      <div class="card-body d-flex flex-column gap-2">
        <h3 class="card-title h5 mb-0">${title}</h3>
        
        <div class="d-flex flex-wrap gap-2 text-muted small">
          <span title="Source" class="d-flex align-items-center gap-1">
            <i class="bi bi-building"></i>
            ${this.escapeHtml(article.source)}
          </span>
          <span title="Author" class="d-flex align-items-center gap-1">
            <i class="bi bi-person"></i>
            ${this.escapeHtml(article.author || 'Unknown')}
          </span>
          <span title="Published" class="d-flex align-items-center gap-1">
            <i class="bi bi-calendar"></i>
            ${publishedDate}
          </span>
        </div>
        
        <p class="card-text text-muted flex-grow-1">${summary}</p>
        
        ${article.categories && article.categories.length > 0 ? `
          <div class="d-flex flex-wrap gap-1 mt-2">
            ${article.categories.slice(0, 3).map(cat => `
              <span class="badge bg-secondary bg-opacity-10 text-secondary small">
                ${this.escapeHtml(cat)}
              </span>
            `).join('')}
            ${article.categories.length > 3 ? '<span class="badge bg-light text-muted">...</span>' : ''}
          </div>
        ` : ''}
      </div>
      
      <div class="card-footer bg-light d-flex gap-2">
        <button class="btn btn-primary btn-sm read-article-btn flex-grow-1" data-article-id="${article.id}">
          Read Article
        </button>
        <a href="${article.link}" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-box-arrow-up-right"></i>
        </a>
      </div>
    `;
    
    // Add click handlers
    this.setupCardEventListeners(card, article);
    
    return card;
  },
  
  /**
   * Setup event listeners for a card
   * @param {HTMLElement} card - Card element
   * @param {Object} article - Article data
   */
  setupCardEventListeners(card, article) {
    // Card click (navigate to article)
    card.addEventListener('click', (e) => {
      // Check authentication
      if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
      }
      
      // Only navigate if the click is not on the favorite button or original link
      if (!e.target.closest('.favorite-btn') && !e.target.closest('a.btn')) {
        console.log('Card clicked');
        console.log('Article object:', article);
        console.log('Article ID:', article.id);
        console.log('Article URL:', article.link);
        console.log('Article ID type:', typeof article.id);
        if (article.link !== null) {
          // Pass the article URL instead of ID for more reliable matching
          const encodedUrl = encodeURIComponent(article.link);
          const navUrl = `news.html#${encodedUrl}`; // Use hash fragment with article URL
          console.log('Navigating to:', navUrl);
          window.location.assign(navUrl);
        } else if (article.id !== null) {
          // Fallback to ID if URL is not available
          const encodedId = encodeURIComponent(article.id);
          const navUrl = `news.html#${encodedId}`; // Use hash fragment with article ID
          console.log('Navigating to (fallback):', navUrl);
          window.location.assign(navUrl);
        } else {
          console.error('DEBUG Frontend: Attempted to navigate, but article ID and URL were missing from card.');
        }
      }
    });
    
    // Favorite button
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', async (e) => {
        // Check authentication
        if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
          window.location.href = 'index.html';
          return;
        }
        
        e.stopPropagation();
        
        // Get current favorite status
        const isCurrentlyFavorited = this.isFavorited(article.id);
        
        // Update UI immediately for better responsiveness
        if (isCurrentlyFavorited) {
          favoriteBtn.classList.remove('active', 'text-danger');
          favoriteBtn.classList.add('text-muted');
          favoriteBtn.innerHTML = '<i class="bi bi-heart"></i>';
        } else {
          favoriteBtn.classList.remove('text-muted');
          favoriteBtn.classList.add('active', 'text-danger');
          favoriteBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
        }
        
        // Perform the actual favorite operation
        try {
          if (isCurrentlyFavorited) {
            await Favorites.removeFavorite(article.id);
          } else {
            await Favorites.addFavorite(article);
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          // Revert UI on error
          if (isCurrentlyFavorited) {
            favoriteBtn.classList.remove('text-muted');
            favoriteBtn.classList.add('active', 'text-danger');
            favoriteBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
          } else {
            favoriteBtn.classList.remove('active', 'text-danger');
            favoriteBtn.classList.add('text-muted');
            favoriteBtn.innerHTML = '<i class="bi bi-heart"></i>';
          }
        }
        
        // Update all favorite buttons across the UI
        this.updateFavoriteButtons();
      });
    }
    
    // Read article button
    const readBtn = card.querySelector('.read-article-btn');
    if (readBtn) {
      readBtn.addEventListener('click', (e) => {
        // Check authentication
        if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
          window.location.href = 'index.html';
          return;
        }
        
        e.stopPropagation(); // Prevent card click from also firing
        console.log('Read article button clicked');
        console.log('Article object:', article);
        console.log('Article ID:', article.id);
        console.log('Article URL:', article.link);
        if (article.link !== null) {
          // Pass the article URL instead of ID for more reliable matching
          const encodedUrl = encodeURIComponent(article.link);
          const navUrl = `news.html#${encodedUrl}`; // Use hash fragment with article URL
          console.log('Navigating to:', navUrl);
          window.location.assign(navUrl);
        } else if (article.id !== null) {
          // Fallback to ID if URL is not available
          const encodedId = encodeURIComponent(article.id);
          const navUrl = `news.html#${encodedId}`; // Use hash fragment with article ID
          console.log('Navigating to (fallback):', navUrl);
          window.location.assign(navUrl);
        } else {
          console.error('DEBUG Frontend: Read Article button clicked, but article ID and URL were missing.');
        }
      });
    }
  },
  
  /**
   * Toggle favorite status of an article
   * @param {Object} article - Article to toggle
   */
  toggleFavorite(article) {
    if (typeof Favorites === 'undefined') {
      console.error('Favorites module not available');
      return;
    }
    
    if (Favorites.isFavorited(article.id)) {
      Favorites.removeFavorite(article.id);
    } else {
      Favorites.addFavorite(article);
    }
    
    // Update UI
    this.updateFavoriteButtons();
    
    // If showing favorites, refresh the view
    if (this.showingFavorites) {
      this.displayFavorites();
    }
  },
  
  /**
   * Check if article is favorited
   * @param {string} articleId - Article ID
   * @returns {boolean} True if favorited
   */
  isFavorited(articleId) {
    return typeof Favorites !== 'undefined' ? Favorites.isFavorited(articleId) : false;
  },
  
  /**
   * Update favorite buttons across the UI
   */
  updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
      const articleId = btn.getAttribute('data-article-id');
      const isFavorited = this.isFavorited(articleId);
      
      // Update button classes and icon
      if (isFavorited) {
        btn.classList.remove('text-muted');
        btn.classList.add('active', 'text-danger');
        btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
      } else {
        btn.classList.remove('active', 'text-danger');
        btn.classList.add('text-muted');
        btn.innerHTML = '<i class="bi bi-heart"></i>';
      }
    });
  },
  
  /**
   * Toggle between news and favorites view
   */
  toggleFavorites() {
    // Check authentication
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }
    
    this.showingFavorites = !this.showingFavorites;
    
    const newsContainer = document.getElementById('newsContainer');
    const favoritesSection = document.getElementById('favoritesSection');
    // Check for both possible IDs
    const favoritesToggle = document.getElementById('favoritesToggle') || document.getElementById('favoritesToggleBottom');
    
    console.log('📍 Elements found:', {
      newsContainer: !!newsContainer,
      favoritesSection: !!favoritesSection,
      favoritesToggle: !!favoritesToggle
    });
    
    if (this.showingFavorites) {
      // Show favorites
      if (newsContainer) newsContainer.classList.add('hidden');
      if (favoritesSection) favoritesSection.classList.remove('hidden');
      if (favoritesToggle) {
        favoritesToggle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          All News
        `;
      }
      
      this.displayFavorites();
    } else {
      // Show news
      if (newsContainer) newsContainer.classList.remove('hidden');
      if (favoritesSection) favoritesSection.classList.add('hidden');
      if (favoritesToggle) {
        favoritesToggle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          Favorites
        `;
      }
      
      this.displayArticles(this.articles);
    }
  },
  
  /**
   * https://www.bbc.com/news/articles/czewkn06y1no?at_medium=RSS&at_campaign=rss
script.js:308 Navigating to: news.html?id=1
   * Display favorites
   */
  displayFavorites() {
    // Check authentication
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }
    
    if (typeof Favorites === 'undefined') {
      console.error('Favorites module not available');
      return;
    }

    const favoritesList = document.getElementById('favoritesList');
    const emptyFavorites = document.getElementById('emptyFavorites');

    if (!favoritesList) {
      console.error('favoritesList element not found');
      return;
    }

    const favorites = Favorites.getFavorites();
    console.log(`📋 Displaying ${favorites.length} favorites`);

    if (favorites.length === 0) {
      favoritesList.innerHTML = '';
      if (emptyFavorites) {
        emptyFavorites.classList.remove('hidden');
      }
      return;
    }

    if (emptyFavorites) {
      emptyFavorites.classList.add('hidden');
    }

    // Clear and populate favorites
    favoritesList.innerHTML = '';
    favorites.forEach(favorite => {
      // Try to get full article data
      const fullArticle = this.articles.find(a => a.id === favorite.id);
      const articleToRender = fullArticle || favorite;
      
      // Use the createFavoriteCard method from Favorites module
      const card = Favorites.createFavoriteCard(articleToRender, {
        showRemoveButton: true,
        onRemove: (articleId) => {
          Favorites.removeFavorite(articleId);
          this.displayFavorites(); // Refresh the favorites view
        }
      });
      favoritesList.appendChild(card);
    });
  },
  
  /**
   * Handle user logout
   */
  handleLogout() {
    if (typeof Auth !== 'undefined') {
      Auth.logout();
    } else {
      localStorage.removeItem('currentUser');
      window.location.reload();
    }
  },
  
  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.loading = loading;
    
    const loadingState = document.getElementById('loadingState');
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    
    if (loadingState) {
      loadingState.classList.toggle('hidden', !loading);
    }
    
    if (refreshBtn) {
      refreshBtn.disabled = loading;
    }
    
    if (refreshIcon) {
      refreshIcon.style.animation = loading ? 'spin 1s linear infinite' : '';
    }
  },
  
  /**
   * Show error state
   * @param {string} message - Error message
   */
  showError(message) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const loadingState = document.getElementById('loadingState');
    
    if (loadingState) {
      loadingState.classList.add('hidden');
    }
    
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    
    if (errorState) {
      errorState.classList.remove('hidden');
    }
  },
  
  /**
   * Hide error state
   */
  hideError() {
    const errorState = document.getElementById('errorState');
    if (errorState) {
      errorState.classList.add('hidden');
    }
  },
  
  /**
   * Update refresh button with last update time
   */
  updateRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      refreshBtn.title = `Last updated: ${timeString}`;
    }
  },
  
  /**
   * Setup auto-refresh timer
   */
  setupAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(() => {
      if (!this.loading && !this.showingFavorites) {
        console.log('🔄 Auto-refreshing news...');
        this.loadNews();
      }
    }, 5 * 60 * 1000);
  },
  
  /**
   * Highlight text matches
   * @param {string} text - Text to highlight
   * @param {Array} matches - Match positions
   * @returns {string} HTML with highlights
   */
  highlightText(text, matches) {
    if (!matches || matches.length === 0) {
      return this.escapeHtml(text);
    }
    
    // Use Search module's highlight function if available
    if (typeof Search !== 'undefined' && Search.highlightMatches) {
      return Search.highlightMatches(text, matches);
    }
    
    return this.escapeHtml(text);
  },
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  /**
   * Generate consistent ID from input string
   * @param {string} input - Input string to hash
   * @returns {string} Generated ID
   */
  generateId(input) {
    if (!input || typeof input !== 'string') {
      return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Simple hash function to generate consistent IDs
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'id_' + Math.abs(hash).toString(16);
  },

  /**
   * Show status message
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error, info)
   */
  showStatusMessage(message, type = 'info') {
    const statusMessages = document.getElementById('statusMessages');
    if (statusMessages) {
      statusMessages.className = `alert alert-${type}`;
      statusMessages.textContent = message;
      statusMessages.classList.remove('hidden');
      
      setTimeout(() => {
        statusMessages.classList.add('hidden');
      }, 5000);
    }
  },
  
  /**
   * Get application statistics
   * @returns {Object} App statistics
   */
  getStats() {
    const stats = {
      articlesLoaded: this.articles.length,
      loading: this.loading,
      showingFavorites: this.showingFavorites,
      currentTheme: document.documentElement.getAttribute('data-theme'),
      lastRefresh: this.lastRefresh || null
    };
    
    // Add module stats
    if (typeof Auth !== 'undefined') {
      stats.auth = Auth.getUserStats();
    }
    
    if (typeof Favorites !== 'undefined') {
      stats.favorites = Favorites.getStats();
    }
    
    if (typeof Search !== 'undefined') {
      stats.search = Search.getStats();
    }
    
    return stats;
  },
  
  /**
   * Export application data
   * @returns {string} JSON string of app data
   */
  exportData() {
    const exportData = {
      articles: this.articles,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
    
    // Add favorites if available
    if (typeof Favorites !== 'undefined') {
      exportData.favorites = Favorites.getFavorites();
    }
    
    return JSON.stringify(exportData, null, 2);
  }
};

// Make App available globally
window.App = App;

// Make renderNewsCard available globally for Search module
window.renderNewsCard = App.renderNewsCard.bind(App);
window.displayArticles = App.displayArticles.bind(App);

// App will be initialized by index.html
// Auto-initialization removed to prevent conflicts

// Add spin animation for refresh button
if (!document.querySelector('#app-animations')) {
  const style = document.createElement('style');
  style.id = 'app-animations';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}