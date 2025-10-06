// Test to check if environment variables are accessible in news.js context
require('dotenv').config();
const express = require('express');
const { fetchAllFeeds } = require('./lib/rssClient');
const cache = require('./lib/cache');
const { safeFetch, normalizeDate, generateId, sanitizeHTML, extractSummary, analyzeSentiment } = require('./lib/utils');

// NewsAPI configuration
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('Environment Variables Test in news.js context:');
console.log('===========================================');
console.log('NEWSAPI_KEY:', NEWSAPI_KEY ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY value:', GEMINI_API_KEY);