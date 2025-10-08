/**
 * Chat module for AI News Aggregator
 * Handles chat history storage using IndexedDB with localStorage fallback
 */

const Chat = {
  // Configuration
  DB_NAME: 'ai_news_chat',
  DB_VERSION: 1,
  STORE_NAME: 'chat_messages',
  FALLBACK_KEY: 'ai_news_chat_fallback',
  
  // Database instance
  db: null,
  
  // Initialize chat module
  async init() {
    console.log('💬 Chat module initialized');
    
    try {
      await this.initIndexedDB();
      console.log('✅ IndexedDB initialized for chat');
    } catch (error) {
      console.warn('IndexedDB unavailable, using localStorage fallback:', error.message);
      this.db = null;
    }
  },
  
  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          
          // Create indexes
          store.createIndex('articleId', 'articleId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  },
  
  /**
   * Initialize chat for specific article
   * @param {string} articleId - Article ID
   */
  initForArticle(articleId) {
    this.currentArticleId = articleId;
    console.log('💬 Chat initialized for article:', articleId);
  },
  
  /**
   * Add message to chat history
   * @param {string} articleId - Article ID
   * @param {Object} message - Message object
   * @returns {Promise<boolean>} Success status
   */
  async addMessage(articleId, message) {
    try {
      // Don't save welcome messages
      if (message.message && message.message.includes("AI assistant")) {
        return true;
      }
      
      const messageData = {
        articleId,
        message: message.message,
        isUser: message.isUser,
        timestamp: message.timestamp || new Date().toISOString(),
        id: this.generateId()
      };
      
      if (this.db) {
        await this.addMessageIndexedDB(messageData);
      } else {
        this.addMessageLocalStorage(messageData);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  },
  
  /**
   * Add message to IndexedDB
   */
  async addMessageIndexedDB(messageData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(messageData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add message to IndexedDB'));
    });
  },
  
  /**
   * Add message to localStorage fallback
   */
  addMessageLocalStorage(messageData) {
    const allMessages = this.getAllMessagesLocalStorage();
    allMessages.push(messageData);
    
    // Keep only last 1000 messages to prevent storage overflow
    if (allMessages.length > 1000) {
      allMessages.splice(0, allMessages.length - 1000);
    }
    
    localStorage.setItem(this.FALLBACK_KEY, JSON.stringify(allMessages));
  },
  
  /**
   * Get messages for article
   * @param {string} articleId - Article ID
   * @returns {Promise<Array>} Array of messages
   */
  async getMessages(articleId) {
    try {
      if (this.db) {
        return await this.getMessagesIndexedDB(articleId);
      } else {
        return this.getMessagesLocalStorage(articleId);
      }
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },
  
  /**
   * Get messages from IndexedDB
   */
  async getMessagesIndexedDB(articleId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('articleId');
      const request = index.getAll(articleId);
      
      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        resolve(messages);
      };
      
      request.onerror = () => reject(new Error('Failed to get messages from IndexedDB'));
    });
  },
  
  /**
   * Get messages from localStorage fallback
   */
  getMessagesLocalStorage(articleId) {
    const allMessages = this.getAllMessagesLocalStorage();
    return allMessages
      .filter(msg => msg.articleId === articleId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
  
  /**
   * Clear messages for article
   * @param {string} articleId - Article ID
   * @returns {Promise<boolean>} Success status
   */
  async clearMessages(articleId) {
    try {
      if (this.db) {
        await this.clearMessagesIndexedDB(articleId);
      } else {
        this.clearMessagesLocalStorage(articleId);
      }
      
      console.log('✅ Chat history cleared for article:', articleId);
      return true;
    } catch (error) {
      console.error('Error clearing messages:', error);
      return false;
    }
  },
  
  /**
   * Clear messages from IndexedDB
   */
  async clearMessagesIndexedDB(articleId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('articleId');
      const request = index.openCursor(articleId);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(new Error('Failed to clear messages from IndexedDB'));
    });
  },
  
  /**
   * Clear messages from localStorage fallback
   */
  clearMessagesLocalStorage(articleId) {
    const allMessages = this.getAllMessagesLocalStorage();
    const filteredMessages = allMessages.filter(msg => msg.articleId !== articleId);
    localStorage.setItem(this.FALLBACK_KEY, JSON.stringify(filteredMessages));
  },
  
  /**
   * Save message (convenience method)
   * @param {string} articleId - Article ID
   * @param {Object} messageData - Message data
   * @returns {Promise<boolean>} Success status
   */
  async saveMessage(articleId, messageData) {
    return await this.addMessage(articleId, messageData);
  },
  
  /**
   * Get all messages from localStorage
   */
  getAllMessagesLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem(this.FALLBACK_KEY) || '[]');
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  },
  
  /**
   * Get chat statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    try {
      let totalMessages = 0;
      let articlesWithChat = new Set();
      let oldestMessage = null;
      let newestMessage = null;
      
      if (this.db) {
        const allMessages = await this.getAllMessagesIndexedDB();
        totalMessages = allMessages.length;
        
        allMessages.forEach(msg => {
          articlesWithChat.add(msg.articleId);
          
          const msgDate = new Date(msg.timestamp);
          if (!oldestMessage || msgDate < new Date(oldestMessage)) {
            oldestMessage = msg.timestamp;
          }
          if (!newestMessage || msgDate > new Date(newestMessage)) {
            newestMessage = msg.timestamp;
          }
        });
      } else {
        const allMessages = this.getAllMessagesLocalStorage();
        totalMessages = allMessages.length;
        
        allMessages.forEach(msg => {
          articlesWithChat.add(msg.articleId);
          
          const msgDate = new Date(msg.timestamp);
          if (!oldestMessage || msgDate < new Date(oldestMessage)) {
            oldestMessage = msg.timestamp;
          }
          if (!newestMessage || msgDate > new Date(newestMessage)) {
            newestMessage = msg.timestamp;
          }
        });
      }
      
      return {
        totalMessages,
        articlesWithChat: articlesWithChat.size,
        oldestMessage,
        newestMessage,
        storageType: this.db ? 'IndexedDB' : 'localStorage'
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      return {
        totalMessages: 0,
        articlesWithChat: 0,
        oldestMessage: null,
        newestMessage: null,
        storageType: 'error'
      };
    }
  },
  
  /**
   * Get all messages from IndexedDB
   */
  async getAllMessagesIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get all messages from IndexedDB'));
    });
  },
  
  /**
   * Export chat history
   * @param {string} articleId - Article ID (optional, exports all if not provided)
   * @returns {Promise<string>} JSON string of chat history
   */
  async exportChat(articleId = null) {
    try {
      let messages;
      
      if (articleId) {
        messages = await this.getMessages(articleId);
      } else {
        if (this.db) {
          messages = await this.getAllMessagesIndexedDB();
        } else {
          messages = this.getAllMessagesLocalStorage();
        }
      }
      
      const exportData = {
        messages,
        exportedAt: new Date().toISOString(),
        articleId,
        totalMessages: messages.length,
        storageType: this.db ? 'IndexedDB' : 'localStorage'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting chat:', error);
      return null;
    }
  },
  
  /**
   * Clear all chat data
   * @returns {Promise<boolean>} Success status
   */
  async clearAllChat() {
    try {
      if (this.db) {
        await this.clearAllChatIndexedDB();
      } else {
        localStorage.removeItem(this.FALLBACK_KEY);
      }
      
      console.log('✅ All chat history cleared');
      return true;
    } catch (error) {
      console.error('Error clearing all chat:', error);
      return false;
    }
  },
  
  /**
   * Clear all chat from IndexedDB
   */
  async clearAllChatIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear all chat from IndexedDB'));
    });
  },
  
  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  /**
   * Format message for display
   * @param {Object} message - Message object
   * @returns {Object} Formatted message
   */
  formatMessage(message) {
    return {
      id: message.id,
      content: message.message,
      isUser: message.isUser,
      timestamp: message.timestamp,
      formattedTime: new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      formattedDate: new Date(message.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    };
  },
  
  /**
   * Search messages
   * @param {string} query - Search query
   * @param {string} articleId - Article ID (optional)
   * @returns {Promise<Array>} Filtered messages
   */
  async searchMessages(query, articleId = null) {
    try {
      let messages;
      
      if (articleId) {
        messages = await this.getMessages(articleId);
      } else {
        if (this.db) {
          messages = await this.getAllMessagesIndexedDB();
        } else {
          messages = this.getAllMessagesLocalStorage();
        }
      }
      
      if (!query.trim()) return messages;
      
      const searchTerm = query.toLowerCase();
      return messages.filter(msg => 
        msg.message.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }
};

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Chat.init());
} else {
  Chat.init();
}

// Make Chat available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Chat;
} else {
  window.Chat = Chat;
}