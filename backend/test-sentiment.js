// Test to check if analyzeSentiment function is working correctly
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

async function testSentiment() {
  console.log('Sentiment Analysis Test:');
  console.log('======================');
  console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? 'SET' : 'NOT SET');
  
  const testText = 'This is a great article about AI technology.';
  
  try {
    console.log('Testing sentiment analysis with Gemini API key...');
    const sentiment = await analyzeSentiment(testText, GEMINI_API_KEY);
    console.log('Sentiment result:', sentiment);
  } catch (error) {
    console.log('Sentiment analysis failed:', error.message);
    if (error.response) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  try {
    console.log('\nTesting sentiment analysis without API key (fallback)...');
    const sentiment = await analyzeSentiment(testText, null);
    console.log('Fallback sentiment result:', sentiment);
  } catch (error) {
    console.log('Fallback sentiment analysis failed:', error.message);
  }
}

testSentiment();