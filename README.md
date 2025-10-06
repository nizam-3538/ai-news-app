# AI News Aggregator

A comprehensive, full-stack web application that aggregates news from various sources and provides AI-powered analysis and chat capabilities.

## 🚀 Project Overview

This project is a news aggregation platform that fetches articles from multiple RSS feeds and news APIs. It leverages AI to provide sentiment analysis and allows users to interact with an AI assistant to ask questions about the articles. It features a complete user authentication system, the ability to save favorite articles, and a responsive, dark-mode-enabled UI.

### Key Features

- **📰 Live News Feeds**: Parses RSS feeds and provides a fallback to news APIs.
- **🤖 AI Analysis**: Integrates with Gemini and Groq for content analysis.
- **⭐ Favorites System**: Allows users to save and manage their favorite articles.
- **💬 AI Chat**: An interactive chatbot for asking questions about news articles.
- **🌙 Dark Mode**: Toggle between light and dark themes.
- **📱 Responsive Design**: A mobile-friendly interface.
- **🔐 User Authentication**: Secure user login and registration system.

## 🏗️ Architecture

**Frontend:**
- HTML5, CSS3
- Vanilla JavaScript (ES6+)
- Jest & Testing Library for testing

**Backend:**
- Node.js with Express.js
- MongoDB for the database
- Mongoose for object data modeling
- Jest & Supertest for testing

**AI & External APIs:**
- Google Gemini
- Groq
- Various RSS Feeds

## 📁 Project Structure

```
ai-news-aggregator/
├── frontend/                 # Frontend application
│   ├── tests/               # Frontend tests
│   ├── package.json
│   └── ...
├── backend/                  # Backend application
│   ├── tests/               # Backend tests
│   ├── lib/                 # Core logic
│   ├── routes/              # API routes
│   ├── package.json
│   └── ...
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🛠️ Development Setup

### Prerequisites

- Node.js and npm
- MongoDB (local or a free Atlas account)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file from the example
# (On Windows, use: copy .env.example .env)
cp .env.example .env
```

Next, open the `.env` file and fill in your configuration, such as your `MONGODB_URI` and any AI provider API keys you wish to use.

To run the backend server:
```bash
# Start the development server (with auto-reloading)
npm run dev
```
The backend will be running at `http://localhost:3000`.

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

To run the frontend development server:
```bash
# Start the development server
npm start
```
The frontend will be available at `http://localhost:8080`.

## 🧪 Testing

### Backend Tests

To run the backend test suite:
```bash
cd backend
npm test
```

To run the linter:
```bash
cd backend
npm run lint
```

### Frontend Tests

To run the frontend test suite:
```bash
cd frontend
npm test
```

## 🤖 AI Provider Configuration

The application can use Google Gemini and/or Groq for AI analysis. To enable them, add the following to your `backend/.env` file:

```env
# Get a free API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_google_gemini_api_key_here

# Get an API key from https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here
```

If no AI providers are configured, the chatbot will use a simple fallback mechanism.
