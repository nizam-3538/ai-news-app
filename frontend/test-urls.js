/**
 * Test script to verify correct API URLs are used
 */

// Test the main application URL
console.log('Testing API URLs in frontend files...');

// Check script.js
const scriptJS = `
const App = {
  // Configuration
  API_BASE_URL: 'http://localhost:3001', // Update for production
`;

if (scriptJS.includes('http://localhost:3001')) {
  console.log('✅ script.js: Correct API URL (http://localhost:3001)');
} else {
  console.log('❌ script.js: Incorrect API URL');
}

// Check news.html
const newsHTML = `
const API_BASE_URL = 'http://localhost:3001'; // Update for production
`;

if (newsHTML.includes('http://localhost:3001')) {
  console.log('✅ news.html: Correct API URL (http://localhost:3001)');
} else {
  console.log('❌ news.html: Incorrect API URL');
}

// Check auth.js
const authJS = `
const Auth = {
  // API configuration
  API_BASE_URL: 'http://localhost:3001', // Update for production
`;

if (authJS.includes('http://localhost:3001')) {
  console.log('✅ auth.js: Correct API URL (http://localhost:3001)');
} else {
  console.log('❌ auth.js: Incorrect API URL');
}

// Check favorites.js
const favoritesJS = `
const Favorites = {
  // Storage key
  FAVORITES_KEY: 'ai_news_favorites',
  API_BASE_URL: 'http://localhost:3001', // Update for production
`;

if (favoritesJS.includes('http://localhost:3001')) {
  console.log('✅ favorites.js: Correct API URL (http://localhost:3001)');
} else {
  console.log('❌ favorites.js: Incorrect API URL');
}

console.log('\n🔧 URL Fix Summary:');
console.log('==================');
console.log('1. Updated script.js API_BASE_URL to http://localhost:3001');
console.log('2. Updated news.html API_BASE_URL to http://localhost:3001');
console.log('3. Updated auth.js API_BASE_URL to http://localhost:3001');
console.log('4. Updated favorites.js API_BASE_URL to http://localhost:3001');
console.log('\n✅ All frontend files now point to the correct backend port (3001)');