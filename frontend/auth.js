/**
 * Authentication module for AI News Aggregator
 * Handles client-side authentication using localStorage
 * Note: This is for demo purposes only - production should use secure server-side auth
 */

const Auth = {
  // Storage keys
  USERS_KEY: 'ai_news_users',
  CURRENT_USER_KEY: 'currentUser',
  
  // API configuration
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-backend-url.vercel.app', // Update this with your actual backend URL
  
  // Initialize authentication
  init() {
    console.log('🔐 Auth module initialized');
    // Force a dummy login for direct dashboard access
    this.setCurrentUser({
      id: 'dummy-user-id',
      username: 'GuestUser',
      email: 'guest@example.com',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, 'dummy-token', true); // 'true' for rememberMe to keep it persistent
    this.updateUI();
  },
  
  /**
   * Sign up a new user
   * @param {string} username - Username
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {Promise<Object>} Result object with success status
   */
  async signup(username, email, password) {
    try {
      // Try backend first if available
      const response = await fetch(`${this.API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword: password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return { success: true, user: data.user };
        } else {
          return { success: false, error: data.error };
        }
      }
    } catch (error) {
      console.warn('Backend auth unavailable, using localStorage fallback:', error.message);
    }
    
    // Fallback to localStorage
    return this.signupLocal(username, email, password);
  },
  
  /**
   * Local signup fallback
   */
  signupLocal(username, email, password) {
    try {
      const users = this.getUsers();
      
      // Check if user already exists
      if (users.find(u => u.email === email)) {
        return { success: false, error: 'An account with this email already exists' };
      }
      
      if (users.find(u => u.username === username)) {
        return { success: false, error: 'This username is already taken' };
      }
      
      // Create new user
      const newUser = {
        id: this.generateId(),
        username,
        email,
        password: this.hashPassword(password), // Simple hash for demo
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      users.push(newUser);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      console.log('✅ User created successfully:', username);
      return { success: true, user: { id: newUser.id, username, email, createdAt: newUser.createdAt } };
      
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  },
  
  /**
   * Login user
   * @param {string} email - Email address
   * @param {string} password - Password
   * @param {boolean} rememberMe - Whether to persist login
   * @returns {Promise<Object>} Result object with success status
   */
  async login(email, password, rememberMe = false) {
    try {
      // Try backend first if available
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          this.setCurrentUser(data.user, data.token, rememberMe);
          return { success: true, user: data.user };
        } else {
          return { success: false, error: data.error };
        }
      }
    } catch (error) {
      console.warn('Backend auth unavailable, using localStorage fallback:', error.message);
    }
    
    // Fallback to localStorage
    return this.loginLocal(email, password, rememberMe);
  },
  
  /**
   * Local login fallback
   */
  loginLocal(email, password, rememberMe = false) {
    try {
      const users = this.getUsers();
      const hashedPassword = this.hashPassword(password);
      
      const user = users.find(u => u.email === email && u.password === hashedPassword);
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      const userIndex = users.findIndex(u => u.id === user.id);
      // eslint-disable-next-line security/detect-object-injection
      users[userIndex] = user;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      // Set current user
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      
      this.setCurrentUser(userData, null, rememberMe);
      
      console.log('✅ User logged in successfully:', user.username);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  },
  
  /**
   * Logout current user
   */
  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY + '_expiry');
    console.log('✅ User logged out');
    this.updateUI();
    
    // Redirect to home if on protected page
    if (window.location.pathname.includes('profile') || window.location.pathname.includes('dashboard')) {
      window.location.href = 'index.html';
    }
  },
  
  /**
   * Get current user
   * @returns {Object|null} Current user object or null
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(this.CURRENT_USER_KEY);
      const expiry = localStorage.getItem(this.CURRENT_USER_KEY + '_expiry');
      
      if (!userData) return null;
      
      // Check expiry
      if (expiry && new Date().getTime() > parseInt(expiry)) {
        this.logout();
        return null;
      }
      
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  /**
   * Google OAuth login
   * @param {string} credential - JWT credential from Google
   * @returns {Promise<Object>} Result object with success status
   */
  async googleLogin(credential) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        this.setCurrentUser(data.user, data.token, true); // Remember Google users
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Google authentication failed' };
      }
      
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Failed to authenticate with Google' };
    }
  },
  
  /**
   * Add article to favorites
   * @param {Object} article - Article object with id, title, link, source
   * @returns {Promise<Object>} Result object with success status
   */
  async addFavorite(article) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return { success: false, error: 'Please log in to add favorites' };
    }
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          articleId: article.id,
          title: article.title,
          link: article.link || article.url,
          source: article.source
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        return { success: true, message: data.message, count: data.favoritesCount };
      } else {
        return { success: false, error: data.error || 'Failed to add favorite' };
      }
      
    } catch (error) {
      console.error('Add favorite error:', error);
      return { success: false, error: 'Failed to add favorite' };
    }
  },
  
  /**
   * Remove article from favorites
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Result object with success status
   */
  async removeFavorite(articleId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return { success: false, error: 'Please log in to manage favorites' };
    }
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/favorites/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        return { success: true, message: data.message, count: data.favoritesCount };
      } else {
        return { success: false, error: data.error || 'Failed to remove favorite' };
      }
      
    } catch (error) {
      console.error('Remove favorite error:', error);
      return { success: false, error: 'Failed to remove favorite' };
    }
  },
  
  /**
   * Get user's favorite articles
   * @returns {Promise<Object>} Result object with favorites data
   */
  async getFavorites() {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return { success: false, error: 'Please log in to view favorites' };
    }
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        return { success: true, favorites: data.favorites, count: data.count, limit: data.limit };
      } else {
        return { success: false, error: data.error || 'Failed to get favorites' };
      }
      
    } catch (error) {
      console.error('Get favorites error:', error);
      return { success: false, error: 'Failed to get favorites' };
    }
  },
  
  /**
   * Check if article is favorited
   * @param {string} articleId - Article ID
   * @returns {Promise<boolean>} True if favorited
   */
  async isFavorited(articleId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/favorites/check/${articleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        return data.isFavorited;
      }
      
      return false;
      
    } catch (error) {
      console.error('Check favorite error:', error);
      return false;
    }
  },
  
  /**
   * Check if user is logged in
   * @returns {boolean} True if logged in
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },
  
  /**
   * Set current user data
   */
  setCurrentUser(user, token = null, rememberMe = false) {
    const userData = {
      ...user,
      token,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userData));
    
    // Set expiry (30 days if remember me, 1 day otherwise)
    const expiryTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiryDate = new Date().getTime() + expiryTime;
    localStorage.setItem(this.CURRENT_USER_KEY + '_expiry', expiryDate.toString());
    
    this.updateUI();
  },
  
  /**
   * Update UI based on auth state
   */
  updateUI() {
    const currentUser = this.getCurrentUser();
    const guestActions = document.getElementById('guestActions');
    const userActions = document.getElementById('userActions');
    const usernameElement = document.getElementById('username');
    
    if (currentUser && guestActions && userActions) {
      guestActions.classList.add('hidden');
      userActions.classList.remove('hidden');
      
      if (usernameElement) {
        usernameElement.textContent = currentUser.username || currentUser.email;
      }
    } else if (guestActions && userActions) {
      guestActions.classList.remove('hidden');
      userActions.classList.add('hidden');
    }
  },
  
  /**
   * Get all users from localStorage
   */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },
  
  /**
   * Simple password hashing (for demo only)
   * In production, use proper server-side hashing with bcrypt
   */
  hashPassword(password) {
    // Simple hash for demo - DO NOT use in production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  },
  
  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  /**
   * Validate email format
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  /**
   * Validate password strength
   */
  validatePassword(password) {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
  },
  
  /**
   * Get user stats for admin
   */
  getUserStats() {
    const users = this.getUsers();
    const currentUser = this.getCurrentUser();
    
    return {
      totalUsers: users.length,
      currentUser,
      isLoggedIn: this.isLoggedIn(),
      recentSignups: users.filter(u => {
        const signupDate = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return signupDate > weekAgo;
      }).length
    };
  }
};

// Auto-initialize if DOM is already loaded
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', () => Auth.init());
// } else {
//   Auth.init();
// }

// Make Auth available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
} else {
  window.Auth = Auth;
}