/**
 * Chat module for AI News Aggregator
 * Handles chat UI, user input, and communication with the backend chatbot.
 */

const ChatUI = {
  // Configuration
  API_BASE_URL: 'https://ai-news-app-backend.vercel.app', // Ensure this matches your backend URL

  // DOM Elements
  chatPanel: null,
  chatHistory: null,
  chatInput: null,
  botResponseContainer: null,

  // Initialize the chat UI
  init() {
    console.log('💬 ChatUI module initialized');
    this.createChatPanel();
    this.botResponseContainer = document.getElementById('bot-response-content');
    this.setupEventListeners();
  },

  // Create and inject the chat panel HTML
  createChatPanel() {
    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.className = 'card';
    panel.innerHTML = `
      <div class="card-header">
        <h5>Ask the AI</h5>
      </div>
      <div class="card-body">
        <div id="chat-history" class="mb-3">
          <!-- Chat messages will appear here -->
        </div>
        <div class="input-group">
          <input type="text" id="chat-input" class="form-control" placeholder="Type your question...">
          <button id="chat-send-btn" class="btn btn-primary">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Assign DOM elements
    this.chatPanel = panel;
    this.chatHistory = panel.querySelector('#chat-history');
    this.chatInput = panel.querySelector('#chat-input');
  },

  // Setup event listeners for chat input
  setupEventListeners() {
    const sendButton = this.chatPanel.querySelector('#chat-send-btn');
    sendButton.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        this.sendMessage();
      }
    });
  },

  // Handle sending a message
  async sendMessage() {
    const userMessage = this.chatInput.value.trim();
    if (!userMessage) return;

    // Display user's question in the right-side panel
    this.displayQuestion(userMessage);
    this.chatInput.value = '';

    try {
      // Display loading state in bot response container
      this.botResponseContainer.innerHTML = '<p><em>Thinking...</em></p>';

      const response = await fetch(`${this.API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage, text: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botMessage = data.answer;

      // Display bot's answer in the "Bot Response" container
      this.displayBotResponse(botMessage);

    } catch (error) {
      console.error('Error fetching bot response:', error);
      this.displayBotResponse('<p class="text-danger">Sorry, I encountered an error. Please try again.</p>');
    }
  },

  // Display the user's question in the chat history panel
  displayQuestion(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message user-message';
    messageElement.textContent = message;
    this.chatHistory.appendChild(messageElement);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  },

  // Display the bot's response in the dedicated container
  displayBotResponse(message) {
    this.botResponseContainer.innerHTML = `<p>${message}</p>`;
  }
};

// Initialize the ChatUI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  ChatUI.init();
});