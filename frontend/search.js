/**
 * Search module for AI News Aggregator
 * Handles client-side search with filtering and fuzzy matching
 */

const Search = {
  // Configuration
  searchIndex: [],
  currentResults: [],
  
  // Search options
  options: {
    threshold: 0.3, // Fuzzy search threshold (0 = exact match, 1 = match anything)
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'summary', weight: 0.3 },
      { name: 'content', weight: 0.2 },
      { name: 'source', weight: 0.1 },
      { name: 'author', weight: 0.1 }
    ]
  },
  
  // Initialize search module
  init() {
    console.log('🔍 Search module initialized');
    this.setupEventListeners();
  },
  
  /**
   * Set up event listeners for search functionality
   */
  setupEventListeners() {
    // Main search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.performSearch(e.target.value);
        }, 300); // Debounce search
      });
      
      // Clear search on escape
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });
    }
    
    // Filter dropdowns
    const sourceFilter = document.getElementById('sourceFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (sourceFilter) {
      sourceFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.applyFilters());
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }
  },
  
  /**
   * Index articles for search
   * @param {Array} articles - Articles to index
   */
  indexArticles(articles) {
    if (!Array.isArray(articles)) {
      console.error('Articles must be an array');
      return;
    }
    
    this.searchIndex = articles.map(article => ({
      ...article,
      searchableContent: this.createSearchableContent(article)
    }));
    
    this.updateFilterOptions(articles);
    console.log(`🔍 Indexed ${articles.length} articles for search`);
  },
  
  /**
   * Create searchable content string from article
   * @param {Object} article - Article object
   * @returns {string} Searchable content
   */
  createSearchableContent(article) {
    const parts = [
      article.title || '',
      article.summary || '',
      article.content || '',
      article.source || '',
      article.author || '',
      (article.categories || []).join(' ')
    ];
    
    return parts.filter(part => part).join(' ').toLowerCase();
  },
  
  /**
   * Update filter dropdown options based on articles
   * @param {Array} articles - Articles array
   */
  updateFilterOptions(articles) {
    const sources = [...new Set(articles.map(a => a.source).filter(Boolean))];
    const categories = [...new Set(articles.flatMap(a => a.categories || []))];
    
    // Update source filter
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) {
      const currentValue = sourceFilter.value;
      sourceFilter.innerHTML = '<option value="">All Sources</option>';
      
      sources.sort().forEach(source => {
        const option = document.createElement('option');
        option.value = source;
        option.textContent = source;
        if (source === currentValue) option.selected = true;
        sourceFilter.appendChild(option);
      });
    }
    
    // Update category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      const currentValue = categoryFilter.value;
      // Keep default options
      const defaultOptions = Array.from(categoryFilter.querySelectorAll('option[value=""], option[value="general"], option[value="technology"], option[value="business"], option[value="science"], option[value="health"]'));
      categoryFilter.innerHTML = '';
      defaultOptions.forEach(option => categoryFilter.appendChild(option));
      
      // Add dynamic categories
      const dynamicCategories = categories.filter(cat => 
        !['general', 'technology', 'business', 'science', 'health', 'stocks', 'crypto'].includes(cat.toLowerCase())
      );
      
      dynamicCategories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        if (category === currentValue) option.selected = true;
        categoryFilter.appendChild(option);
      });
    }
  },
  
  /**
   * Perform search on indexed articles
   * @param {string} query - Search query
   * @returns {Array} Search results
   */
  performSearch(query) {
    if (!query || query.trim().length < 2) {
      this.showAllArticles();
      return this.searchIndex;
    }
    
    const searchQuery = query.trim().toLowerCase();
    let results;
    
    // Try to use Fuse.js if available
    if (typeof Fuse !== 'undefined') {
      results = this.performFuzzySearch(searchQuery);
    } else {
      results = this.performBasicSearch(searchQuery);
    }
    
    this.currentResults = results;
    this.displaySearchResults(results, query);
    
    return results;
  },
  
  /**
   * Perform fuzzy search using Fuse.js
   * @param {string} query - Search query
   * @returns {Array} Search results
   */
  performFuzzySearch(query) {
    const fuse = new Fuse(this.searchIndex, this.options);
    const fuseResults = fuse.search(query);
    
    // Extract items from Fuse.js results
    return fuseResults.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }));
  },
  
  /**
   * Perform basic search (fallback when Fuse.js is not available)
   * @param {string} query - Search query
   * @returns {Array} Search results
   */
  performBasicSearch(query) {
    const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
    
    return this.searchIndex.filter(article => {
      // Check if all search terms are found
      return searchTerms.every(term => article.searchableContent.includes(term));
    }).map(article => ({
      ...article,
      score: this.calculateBasicScore(article, searchTerms)
    })).sort((a, b) => a.score - b.score); // Lower score = better match
  },
  
  /**
   * Calculate basic search score
   * @param {Object} article - Article object
   * @param {Array} searchTerms - Search terms
   * @returns {number} Search score
   */
  calculateBasicScore(article, searchTerms) {
    let score = 0;
    
    searchTerms.forEach(term => {
      // Check title (higher weight)
      if (article.title.toLowerCase().includes(term)) {
        score += 1;
      }
      
      // Check summary
      if (article.summary && article.summary.toLowerCase().includes(term)) {
        score += 2;
      }
      
      // Check content
      if (article.content && article.content.toLowerCase().includes(term)) {
        score += 3;
      }
      
      // Check source and author
      if (article.source && article.source.toLowerCase().includes(term)) {
        score += 4;
      }
      
      if (article.author && article.author.toLowerCase().includes(term)) {
        score += 4;
      }
    });
    
    return score;
  },
  
  /**
   * Apply filters to current results
   */
  applyFilters() {
    const sourceFilter = document.getElementById('sourceFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const selectedSource = sourceFilter ? sourceFilter.value : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    
    let filteredResults = this.currentResults.length > 0 ? this.currentResults : this.searchIndex;
    
    // Apply source filter
    if (selectedSource) {
      filteredResults = filteredResults.filter(article => 
        article.source === selectedSource
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filteredResults = filteredResults.filter(article => 
        article.categories && article.categories.some(cat => 
          cat.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    
    this.displaySearchResults(filteredResults);
  },
  
  /**
   * Display search results
   * @param {Array} results - Search results
   * @param {string} query - Original search query (optional)
   */
  displaySearchResults(results, query = '') {
    const searchInfo = document.getElementById('searchInfo');
    const searchQuery = document.getElementById('searchQuery');
    const resultCount = document.getElementById('resultCount');
    const newsList = document.getElementById('newsList');
    const emptyState = document.getElementById('emptyState');
    
    // Update search info
    if (searchInfo && resultCount) {
      resultCount.textContent = results.length;
      
      if (query) {
        searchQuery.textContent = `for "${query}"`;
        searchInfo.classList.remove('hidden');
      } else if (this.hasActiveFilters()) {
        searchQuery.textContent = 'with current filters';
        searchInfo.classList.remove('hidden');
      } else {
        searchInfo.classList.add('hidden');
      }
    }
    
    // Clear current results
    if (newsList) {
      newsList.innerHTML = '';
    }
    
    if (results.length === 0) {
      // Show empty state
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
      return;
    }
    
    // Hide empty state
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    
    // Display results
    if (newsList && typeof window.renderNewsCard === 'function') {
      results.forEach((article, index) => {
        // Find the original index of this article in the main articles array
        const originalIndex = this.searchIndex.findIndex(item => item.id === article.id);
        const card = window.renderNewsCard(article, {
          highlightMatches: query ? this.getHighlightMatches(article, query) : null,
          index: originalIndex >= 0 ? originalIndex : index
        });
        newsList.appendChild(card);
      });
    }
  },
  
  /**
   * Get highlight matches for search query
   * @param {Object} article - Article object
   * @param {string} query - Search query
   * @returns {Object} Highlight matches
   */
  getHighlightMatches(article, query) {
    if (!query) return null;
    
    const searchTerms = query.toLowerCase().split(/\s+/);
    const matches = {};
    
    // Check for matches in different fields
    /* eslint-disable security/detect-object-injection */
    ['title', 'summary'].forEach(field => {
      if (article[field]) {
        const fieldValue = article[field].toLowerCase();
        const fieldMatches = [];
        
        searchTerms.forEach(term => {
          let index = fieldValue.indexOf(term);
          while (index !== -1) {
            fieldMatches.push({
              start: index,
              end: index + term.length
            });
            index = fieldValue.indexOf(term, index + 1);
          }
        });
        
        if (fieldMatches.length > 0) {
          matches[field] = fieldMatches;
        }
      }
    });
    /* eslint-enable security/detect-object-injection */
    
    return Object.keys(matches).length > 0 ? matches : null;
  },
  
  /**
   * Check if there are active filters
   * @returns {boolean} True if filters are active
   */
  hasActiveFilters() {
    const sourceFilter = document.getElementById('sourceFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    return (sourceFilter && sourceFilter.value) || (categoryFilter && categoryFilter.value);
  },
  
  /**
   * Clear search and show all articles
   */
  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.showAllArticles();
  },
  
  /**
   * Clear all filters
   */
  clearFilters() {
    const sourceFilter = document.getElementById('sourceFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (sourceFilter) sourceFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    this.showAllArticles();
  },
  
  /**
   * Show all articles (clear search/filters)
   */
  showAllArticles() {
    this.currentResults = [];
    
    const searchInfo = document.getElementById('searchInfo');
    if (searchInfo) {
      searchInfo.classList.add('hidden');
    }
    
    // Trigger display of all articles
    if (typeof window.displayArticles === 'function') {
      window.displayArticles(this.searchIndex);
    }
  },
  
  /**
   * Highlight text matches in HTML
   * @param {string} text - Text to highlight
   * @param {Array} matches - Match positions
   * @returns {string} HTML with highlighted matches
   */
  highlightMatches(text, matches) {
    if (!matches || matches.length === 0) {
      return this.escapeHtml(text);
    }
    
    // Sort matches by start position
    const sortedMatches = matches.sort((a, b) => a.start - b.start);
    
    let result = '';
    let lastEnd = 0;
    
    sortedMatches.forEach(match => {
      // Add text before match
      result += this.escapeHtml(text.slice(lastEnd, match.start));
      
      // Add highlighted match
      result += `<mark class="search-highlight">${this.escapeHtml(text.slice(match.start, match.end))}</mark>`;
      
      lastEnd = match.end;
    });
    
    // Add remaining text
    result += this.escapeHtml(text.slice(lastEnd));
    
    return result;
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
   * Get search statistics
   * @returns {Object} Search statistics
   */
  getStats() {
    return {
      totalArticles: this.searchIndex.length,
      currentResults: this.currentResults.length,
      hasActiveSearch: this.currentResults.length > 0,
      hasActiveFilters: this.hasActiveFilters(),
      fuzzySearchAvailable: typeof Fuse !== 'undefined'
    };
  },
  
  /**
   * Export search results
   * @returns {string} JSON string of current results
   */
  exportResults() {
    const exportData = {
      query: document.getElementById('searchInput') ? document.getElementById('searchInput').value : '',
      results: this.currentResults,
      filters: {
        source: document.getElementById('sourceFilter') ? document.getElementById('sourceFilter').value : '',
        category: document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : ''
      },
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }
};

// Make Search available globally
window.Search = Search;

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Search.init());
} else {
  Search.init();
}

// Add search highlight styles if not present
if (!document.querySelector('#search-styles')) {
  const style = document.createElement('style');
  style.id = 'search-styles';
  style.textContent = `
    .search-highlight {
      background-color: var(--accent-color, #ffd700);
      color: var(--text-color, #000);
      padding: 1px 2px;
      border-radius: 2px;
      font-weight: 500;
    }
    
    .search-no-results {
      text-align: center;
      padding: var(--spacing-2xl);
      color: var(--text-secondary);
    }
  `;
  document.head.appendChild(style);
}