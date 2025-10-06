/**
 * Debug script to analyze article count and sentiment issues
 */

require('dotenv').config();
const { Sentiment } = require('./lib/utils');

async function debugIssues() {
  console.log('🔍 DEBUGGING ARTICLE COUNT AND SENTIMENT ISSUES');
  console.log('=' .repeat(60));
  
  // Test 1: Check API response
  console.log('\n1️⃣ Testing API Response:');
  try {
    const response = await fetch('http://localhost:3000/news?limit=200');
    const data = await response.json();
    
    console.log(`📊 Total articles returned: ${data.data.length} (requested: 200)`);
    
    // Analyze sentiment distribution
    const sentiments = {};
    data.data.forEach(article => {
      const sentiment = article.sentiment || 'undefined';
      sentiments[sentiment] = (sentiments[sentiment] || 0) + 1;
    });
    
    console.log('📈 Sentiment distribution:');
    Object.entries(sentiments).forEach(([sentiment, count]) => {
      const percentage = ((count / data.data.length) * 100).toFixed(1);
      console.log(`   ${sentiment}: ${count} articles (${percentage}%)`);
    });
    
    // Show sample headlines and their sentiments
    console.log('\n📰 Sample articles with sentiment analysis:');
    data.data.slice(0, 10).forEach((article, i) => {
      const emoji = article.sentiment === 'positive' ? '🟢' : 
                   article.sentiment === 'negative' ? '🔴' : '🟡';
      console.log(`${i+1}. ${emoji} ${article.sentiment}: "${article.title}"`);
    });
    
  } catch (error) {
    console.log(`❌ API test failed: ${error.message}`);
  }
  
  // Test 2: Test sentiment function directly with positive examples
  console.log('\n2️⃣ Testing Sentiment Function with Positive Examples:');
  const positiveTests = [
    'Amazing breakthrough wins prestigious award',
    'Company celebrates record-breaking success',
    'Innovative technology revolutionizes industry',
    'Team achieves historic victory in championship',
    'Scientific discovery brings hope for future',
    'Outstanding performance earns universal acclaim'
  ];
  
  positiveTests.forEach(headline => {
    const sentiment = Sentiment(headline);
    const emoji = sentiment === 'Positive' ? '🟢' : sentiment === 'Negative' ? '🔴' : '🟡';
    console.log(`${emoji} "${headline}" -> ${sentiment}`);
  });
  
  // Test 3: Check news sources and limits
  console.log('\n3️⃣ Analyzing News Sources:');
  try {
    const response = await fetch('http://localhost:3000/news?limit=200');
    const data = await response.json();
    
    const sources = {};
    data.data.forEach(article => {
      const source = article.source || 'unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    console.log('📡 Articles by source:');
    Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`   ${source}: ${count} articles`);
      });
      
  } catch (error) {
    console.log(`❌ Source analysis failed: ${error.message}`);
  }
  
  console.log('\n🔧 ANALYSIS COMPLETE');
}

debugIssues();