/**
 * Main application script for AI News Aggregator
 * Coordinates all modules and handles core application logic
 */

const App = {
  // Configuration
  API_BASE_URL: 'http://localhost:3000', // Update for production
  
  // State
  articles: [],
  loading: false,
  showingFavorites: false,
  
  // Initialize application
  init() {
    console.log('🚀 AI News Aggregator application initialized');
    
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
    
    // Favorites toggle
    const favoritesToggle = document.getElementById('favoritesToggle');
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
    if (this.loading) return;

    this.setLoading(true);
    this.hideError();

    try {
      // Add cache-busting parameter with timestamp
      const timestamp = new Date().getTime();
      const url = `${this.API_BASE_URL}/news?_=${timestamp}${force ? '&force=true' : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load news');
      }
      
      // Clear existing articles before adding new ones
      this.articles = [];
      
      // Process each article with index-based approach
      data.data.forEach((article, index) => {
        const cleanArticle = {
          id: String(article.id || article.link || `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`), // Ensure ID is a string
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
        
        this.articles.push(cleanArticle);
      });
      
      console.log(`📰 Loaded ${this.articles.length} articles`);
      
      // Index articles for search
      if (typeof Search !== 'undefined') {
        Search.indexArticles(this.articles);
      }
      
      // Display articles
      this.displayArticles(this.articles);
      
      // Update refresh button
      this.updateRefreshButton();
      
    } catch (error) {
      console.error('Error loading news:', error); // Log the entire error object
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
    card.className = 'card news-card card-clickable';
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
    let sentimentEmoji;
    switch (sentiment) {
      case 'positive':
        sentimentEmoji = '🟢';
        break;
      case 'negative':
        sentimentEmoji = '🔴';
        break;
      default:
        sentimentEmoji = '🟡';
    }

    // Highlight matches if provided
    const title = highlightMatches && highlightMatches.title 
      ? this.highlightText(article.title, highlightMatches.title)
      : this.escapeHtml(article.title);
      
    const summary = highlightMatches && highlightMatches.summary
      ? this.highlightText(article.summary, highlightMatches.summary)
      : this.escapeHtml(article.summary || 'No summary available.');
    
    card.innerHTML = `
      <div class="card-header">
        <div class="sentiment-badge sentiment-${sentiment}" title="${sentiment} sentiment">
          ${sentimentEmoji} ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
        </div>
        
        <button class="favorite-btn ${this.isFavorited(article.id) ? 'active' : ''}" 
                aria-label="Toggle favorite" 
                data-article-id="${article.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${this.isFavorited(article.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </button>
      </div>
      
      <div class="card-content">
        <h3 class="card-title">${title}</h3>
        
        <div class="card-meta">
          <span title="Source">📰 ${this.escapeHtml(article.source)}</span>
          <span title="Author">✍️ ${this.escapeHtml(article.author || 'Unknown')}</span>
          <span title="Published">📅 ${publishedDate}</span>
        </div>
        
        <p class="card-content">${summary}</p>
        
        ${article.categories && article.categories.length > 0 ? `
          <div style="margin-top: var(--spacing-sm);">
            ${article.categories.slice(0, 3).map(cat => `
              <span class="btn btn-sm" style="padding: 2px 8px; margin-right: 4px; background-color: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; font-size: var(--font-size-xs);">
                ${this.escapeHtml(cat)}
              </span>
            `).join('')}
            ${article.categories.length > 3 ? '<span class="text-muted">...</span>' : ''}
          </div>
        ` : ''}
      </div>
      
      <div class="card-footer">
        <button class="btn btn-primary btn-sm read-article-btn" data-article-index="${index}">
          Read Article
        </button>
        <a href="${article.link}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          Original
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
      // Only navigate if the click is not on the favorite button or original link
      if (!e.target.closest('.favorite-btn') && !e.target.closest('a.btn')) {
        const articleIndex = card.getAttribute('data-article-index');
        if (articleIndex !== null) {
          const navUrl = `news.html#${articleIndex}`; // Use hash fragment with index
          window.location.assign(navUrl);
        } else {
          console.error('DEBUG Frontend: Attempted to navigate, but article index was missing from card.');
        }
      }
    });
    
    // Favorite button
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(article);
      });
    }
    
    // Read article button
    const readBtn = card.querySelector('.read-article-btn');
    if (readBtn) {
      readBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click from also firing
        const articleIndex = readBtn.getAttribute('data-article-index');
        if (articleIndex !== null) {
          const navUrl = `news.html#${articleIndex}`; // Use hash fragment with index
          window.location.assign(navUrl);
        } else {
          console.error('DEBUG Frontend: Read Article button clicked, but article index was missing.');
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
      const svgPath = btn.querySelector('svg');
      
      btn.classList.toggle('active', isFavorited);
      
      // Update SVG fill attribute
      if (svgPath) {
        svgPath.setAttribute('fill', isFavorited ? 'currentColor' : 'none');
      }
    });
  },
  
  /**
   * Toggle between news and favorites view
   */
  toggleFavorites() {
    this.showingFavorites = !this.showingFavorites;
    
    const newsContainer = document.getElementById('newsContainer');
    const favoritesSection = document.getElementById('favoritesSection');
    const favoritesToggle = document.getElementById('favoritesToggle');
    
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
   * Generate a consistent ID for frontend articles based on a URL or other identifier.
   * This is a simplified hash function for client-side consistency.
   * @param {string} identifier - The string to hash (e.g., article URL).
   * @returns {string} A consistent ID.
   */
  generateConsistentId(identifier) {
    if (!identifier) return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // A simple, non-cryptographic hash for client-side consistency.
    // This is a fallback if the backend doesn't provide an ID.
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
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