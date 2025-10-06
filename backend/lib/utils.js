/**
 * Utility functions for the AI News Aggregator backend
 * Provides: safe HTTP client, ID generation, date normalization, HTML sanitization, deduplication
 */

const crypto = require('crypto');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

// Initialize DOMPurify with JSDOM window
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

/**
 * Safe HTTP fetch wrapper with timeout and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Axios options
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} Response data or error
 */
async function safeFetch(url, options = {}, timeout = 10000) {
  try {
    const response = await axios({
      url,
      timeout,
      ...options,
      headers: {
        'User-Agent': 'AI-News-Aggregator/1.0.0',
        ...options.headers
      }
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 0,
      code: error.code,
      // Include provider response body (if any) for better debugging (may contain auth error details)
      responseBody: error.response?.data || null
    };
  }
}

/**
 * Generate SHA-256 hash ID from input string
 * @param {string} input - Input string to hash
 * @returns {string} SHA-256 hash as hex string
 */
function generateId(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Normalize date to UTC ISO8601 format
 * @param {string|Date} dateInput - Date to normalize
 * @returns {string} ISO8601 UTC date string
 */
function normalizeDate(dateInput) {
  try {
    if (!dateInput) return new Date().toISOString();
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Sanitize HTML content to prevent XSS
 * Note: This is a demo-grade sanitizer, not production-ready
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  
  // Use DOMPurify to remove dangerous elements and attributes
  const sanitized = domPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'i', 'a', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
  
  return sanitized;
}

/**
 * Normalize URL for consistent deduplication
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Remove query parameters and fragments for better deduplication
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.toLowerCase();
  } catch (error) {
    return url.toLowerCase().trim();
  }
}

/**
 * Deduplicate articles by URL
 * @param {Array} articles - Array of article objects
 * @returns {Array} Deduplicated articles
 */
function dedupeByUrl(articles) {
  if (!Array.isArray(articles)) return [];
  
  const seen = new Set();
  const deduplicated = [];
  
  for (const article of articles) {
    if (!article || !article.link) continue;
    
    const normalizedUrl = normalizeUrl(article.link);
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      deduplicated.push({
        ...article,
        id: generateId(normalizedUrl) // Generate consistent ID based on normalized URL
      });
    }
  }
  
  return deduplicated;
}

/**
 * Extract first N sentences from text for summaries
 * @param {string} text - Text to extract from
 * @param {number} maxSentences - Maximum sentences to extract
 * @returns {string} Extracted sentences
 */
function extractSummary(text, maxSentences = 3) {
  if (!text || typeof text !== 'string') return '';
  
  // Simple sentence splitting (not perfect but adequate for demo)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, maxSentences);
  
  return sentences.join('. ') + (sentences.length > 0 ? '.' : '');
}

/**
 * Get enhanced content by combining all available text sources
 * @param {Object} article - Article object with content, description, summary
 * @returns {string} Enhanced content combining all sources
 */
function getEnhancedContent(article) {
  if (!article) return '';
  
  // Collect all available text content
  const contentSources = [
    article.content,
    article.description,
    article.summary,
    article.text,
    article.body
  ].filter(Boolean).filter(text => text.length > 20);
  
  if (contentSources.length === 0) return '';
  
  // Remove duplicates and combine unique content
  const uniqueContent = [];
  const seen = new Set();
  
  for (const content of contentSources) {
    // Create a normalized version for comparison (remove extra whitespace, punctuation)
    const normalized = content.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    
    if (!seen.has(normalized) && normalized.length > 20) {
      seen.add(normalized);
      uniqueContent.push(content.trim());
    }
  }
  
  // Join unique content with paragraph breaks
  return uniqueContent.join('\n\n');
}

/**
 * A FINAL TUNED sentiment analyzer with an expanded and refined lexicon.
 * Note: This model's accuracy is limited when dealing with sarcasm, idioms,
 * and complex context.
 *
 * @param {string} headline The news headline to analyze.
 * @returns {string} The calculated sentiment: 'Positive', 'Neutral', or 'Negative'.
 */
function Sentiment(headline) {
    // --- Input Validation ---
    if (typeof headline !== 'string' || headline.trim() === '') {
        return 'Neutral';
    }

    // --- FINAL TUNED Lexicon ---
    const lexicon = {
        // -- Strong Positives (score > 6.0) --
        'acclaimed': 6.8, 'award': 7.1, 'breakthrough': 8.1, 'booming': 6.6, 'celebrated': 7.3, 'champion': 7.2,
        'flawless': 8.5, 'great': 7.0, 'heartwarming': 7.9, 'historic': 7.1, 'innovative': 7.5,
        'masterpiece': 9.2, 'miracle': 8.5, 'outstanding': 9.6, 'pioneering': 6.8, 'prestigious': 6.2,
        'record-breaking': 8.8, 'spectacular': 8.3, 'superb': 7.9, 'triumph': 8.2, 'victory': 7.8,

        // -- Moderate Positives (2.6 to 6.0) --
        'accomplish': 5.1, 'achieve': 4.1, 'acquisition': 2.9, 'advancement': 4.3, 'alliance': 3.5,
        'approve': 3.2, 'bullish': 6.0, 'charity': 3.8, 'deal': 2.6, 'donation': 4.3, 'earnings': 4.2,
        'empower': 5.2, 'endorse': 3.9, 'expansion': 3.1, 'hope': 4.1, 'peace': 8.2, 'positive': 3.5,
        'profit': 4.6, 'recover': 3.6, 'reform': 2.8, 'relief': 3.4, 'rescue': 4.8, 'solid': 2.7,
        'stabilize': 3.1, 'success': 5.9, 'wins': 4.5,

        // -- Mild Positives (0.1 to 2.5) --
        'agreement': 2.1, 'appoints': 0.8, 'boost': 2.5, 'commitment': 1.8, 'confidence': 2.3,
        'denies': 1.5, 'growth': 2.2, 'investment': 1.9, 'launch': 1.7, 'massive': 1.0, 'merger': 1.5,
        'negotiation': 1.2, 'pledge': 1.4, 'rebound': 2.4, 'surge': 2.2, 'talks': 1.1, 'upgrade': 2.1,

        // -- Neutral (approx 0) --
        'announces': 0.0, 'committee': 0.0, 'federal': 0.0, 'government': 0.0, 'hearing': 0.0,
        'legislation': 0.4, 'meeting': 0.0, 'policy': 0.0, 'report': 0.0, 'rules': 0.0, 'shares': 0.0, 'study': 0.0,

        // -- Mild Negatives (-0.1 to -2.5) --
        'allegation': -2.1, 'caution': -1.2, 'concern': -2.2, 'dispute': -2.5, 'drop': -2.1,
        'delay': -1.6, 'disappointing': -2.4, 'disruption': -1.9, 'investigation': -2.2,
        'issue': -1.8, 'jobless': -2.3, 'lawsuit': -2.5, 'questions': -1.1, 'risk': -2.4,
        'speculation': -1.5, 'uncertainty': -1.9, 'volatile': -2.5,

        // -- Moderate Negatives (-2.6 to -6.0) --
        'attack': -7.1, 'backlash': -4.8, 'blame': -4.1, 'boycott': -4.6, 'clash': -4.2, 'condemn': -5.6,
        'confrontation': -4.9, 'controversial': -3.6, 'cuts': -3.2, 'damage': -5.8, 'deadlock': -5.5,
        'debt': -4.9, 'decline': -3.8, 'deficit': -4.1, 'glitch': -3.7, 'impasse': -4.4, 'leak': -4.8,
        'outage': -5.8, 'outcry': -4.7, 'panic': -5.9, 'protest': -4.3, 'reject': -3.3,
        'restrictions': -4.4, 'sanctions': -5.3, 'scarcity': -4.6, 'slump': -5.7, 'standoff': -3.9,
        'strain': -5.2, 'struggle': -3.7, 'threat': -4.7, 'turmoil': -5.1, 'veto': -4.2, 'warning': -2.8,

        // -- Strong Negatives (score < -6.0) --
        'assault': -7.2, 'bankrupt': -7.6, 'brutality': -8.7, 'catastrophe': -9.7, 'chaos': -8.1,
        'collapse': -8.2, 'collusion': -7.8, 'convicted': -7.8, 'corruption': -8.6, 'crisis': -7.3,
        'cyberattack': -8.3, 'danger': -5.5, 'deadly': -9.3, 'devastating': -9.1, 'disaster': -9.8,
        'disease': -6.8, 'eviction': -6.2, 'explode': -7.7, 'fraud': -7.5, 'hostage': -8.4,
        'illegal': -6.7, 'incarcerated': -7.9, 'invasion': -8.9, 'massacre': -9.9, 'outbreak': -7.5,
        'recession': -8.1, 'scandal': -7.1, 'shutdown': -6.9, 'slaughter': -9.4, 'tragedy': -8.7,
        'treason': -9.2, 'virus': -5.1, 'vulnerability': -6.6, 'war': -9.5
    };

    const negations = ['not', 'no', 'never', 'isnt', 'wasnt', 'shouldnt', 'wouldnt', 'couldnt', 'wont', 'cant', 'dont', 'doesnt'];
    const tokens = headline.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
    let score = 0;
    let isNegated = false;
    for (const token of tokens) {
        if (negations.includes(token)) {
            isNegated = true;
            continue;
        }
        if (lexicon.hasOwnProperty(token)) {
            let wordScore = lexicon[token];
            if (isNegated) {
                wordScore = -wordScore;
                isNegated = false;
            }
            score += wordScore;
        }
    }
    const THRESHOLD = 3.5;
    if (score > 1.5) {
        return 'Positive';
    } else if (score < -2) {
        return 'Negative';
    } else {
        return 'Neutral';
    }
}

/**
 * Gemini AI-powered sentiment analysis with enhanced fallback
 * @param {string} text - Text to analyze
 * @param {string} geminiApiKey - Gemini API key (optional)
 * @returns {Promise<string>} Sentiment: 'positive', 'negative', or 'neutral'
 */
async function analyzeSentiment(text, geminiApiKey = null) {
  if (!text || typeof text !== 'string') return 'neutral';
  
  // Use the enhanced Sentiment function as primary analyzer
  try {
    const sentiment = Sentiment(text);
    // Convert to lowercase for consistency with the rest of the application
    const normalizedSentiment = sentiment.toLowerCase();
    console.log(`Sentiment analysis for "${text.substring(0, 50)}...": ${normalizedSentiment}`);
    return normalizedSentiment;
  } catch (error) {
    console.warn('Enhanced sentiment analysis failed, using fallback:', error.message);
    
    // Fallback to context-aware analysis if the enhanced function fails
    return getContextAwareSentiment(text);
  }
}

/**
 * Get sentiment analysis from Gemini AI
 * @param {string} text - Text to analyze
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} Sentiment result
 */
async function getGeminiSentiment(text, apiKey) {
  const prompt = `Analyze the sentiment of the following text and respond with ONLY ONE WORD: either "positive", "negative", or "neutral".

Text: "${text}"

Sentiment:`;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 10
      }
    }
  });
  
  if (!response.success) {
    throw new Error(`Gemini API error: ${response.error}`);
  }
  
  const candidate = response.data.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.[0]?.text) {
    throw new Error('Invalid Gemini response format');
  }
  
  const result = candidate.content.parts[0].text.trim().toLowerCase();
  
  // Validate response
  if (['positive', 'negative', 'neutral'].includes(result)) {
    return result;
  }
  
  throw new Error(`Invalid sentiment response: ${result}`);
}

/**
 * Enhanced rule-based sentiment analysis (fallback) with improved accuracy
 * @param {string} text - Text to analyze
 * @returns {string} Sentiment: 'positive', 'negative', or 'neutral'
 */
function getEnhancedRuleBasedSentiment(text) {
  
  // Enhanced word lists with intensity weights and context awareness
  const positiveWords = {
    // Strong positive (weight: 3)
    'excellent': 3, 'outstanding': 3, 'amazing': 3, 'fantastic': 3, 'wonderful': 3,
    'brilliant': 3, 'exceptional': 3, 'magnificent': 3, 'superb': 3, 'triumph': 3,
    'victory': 3, 'breakthrough': 3, 'revolutionary': 3, 'extraordinary': 3, 'incredible': 3,
    'phenomenal': 3, 'spectacular': 3, 'remarkable': 3, 'astonishing': 3, 'marvelous': 3,
    
    // Medium positive (weight: 2)
    'good': 2, 'great': 2, 'success': 2, 'successful': 2, 'positive': 2,
    'improvement': 2, 'progress': 2, 'advance': 2, 'growth': 2, 'gain': 2,
    'increase': 2, 'rise': 2, 'boost': 2, 'benefit': 2, 'advantage': 2,
    'opportunity': 2, 'achievement': 2, 'accomplish': 2, 'win': 2, 'winning': 2,
    'favorable': 2, 'promising': 2, 'optimistic': 2, 'delighted': 2, 'pleased': 2,
    
    // Mild positive (weight: 1)
    'up': 1, 'better': 1, 'improve': 1, 'helpful': 1, 'useful': 1,
    'happy': 1, 'glad': 1, 'hope': 1, 'hopeful': 1, 'potential': 1, 'recover': 1,
    'encouraging': 1, 'uplifting': 1, 'supportive': 1, 'valuable': 1, 'beneficial': 1
  };
  
  const negativeWords = {
    // Strong negative (weight: 3)
    'terrible': 3, 'awful': 3, 'horrible': 3, 'devastating': 3, 'catastrophic': 3,
    'disaster': 3, 'crisis': 3, 'collapse': 3, 'crash': 3, 'failure': 3,
    'emergency': 3, 'scandal': 3, 'corruption': 3, 'fraud': 3, 'tragedy': 3,
    'nightmare': 3, 'catastrophe': 3, 'disastrous': 3, 'horrific': 3, 'atrocious': 3,
    
    // Medium negative (weight: 2)
    'bad': 2, 'negative': 2, 'problem': 2, 'issue': 2, 'concern': 2,
    'decline': 2, 'decrease': 2, 'fall': 2, 'drop': 2, 'loss': 2,
    'lose': 2, 'fail': 2, 'failing': 2, 'threat': 2, 'risk': 2,
    'challenge': 2, 'difficulty': 2, 'trouble': 2, 'danger': 2, 'warning': 2,
    'worrisome': 2, 'alarming': 2, 'disturbing': 2, 'troubling': 2, 'concerning': 2,
    
    // Mild negative (weight: 1)
    'down': 1, 'lower': 1, 'worse': 1, 'disappointing': 1, 'unfortunate': 1,
    'worry': 1, 'doubt': 1, 'uncertain': 1, 'struggle': 1,
    'conflict': 1, 'controversy': 1, 'criticism': 1, 'protest': 1, 'oppose': 1,
    'difficult': 1, 'complicated': 1, 'complex': 1, 'challenging': 1
  };
  
  // Negation words that flip sentiment
  const negationWords = ['not', 'no', 'never', 'nothing', 'nobody', 'nowhere', 
    'neither', 'nor', 'none', 'hardly', 'scarcely', 'barely',
    'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 
    'can\'t', 'couldn\'t', 'shouldn\'t'];
  
  // Intensifiers that amplify sentiment
  const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 
    'completely', 'utterly', 'highly', 'remarkably', 'exceptionally'];
  
  // Diminishers that reduce sentiment
  const diminishers = ['somewhat', 'slightly', 'barely', 'hardly', 'marginally', 
    'moderately', 'relatively', 'fairly', 'quite', 'rather'];
  
  const sentences = text.toLowerCase().split(/[.!?]+/).filter(s => s.trim().length > 0);
  let totalScore = 0;
  let wordCount = 0;
  
  sentences.forEach(sentence => {
    const words = sentence.split(/\s+/);
    let sentenceScore = 0;
    let negated = false;
    let intensified = false;
    let diminished = false;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-z']/g, ''); // Remove punctuation but keep apostrophes
      
      // Check for negation words
      if (negationWords.includes(word)) {
        negated = true;
        continue;
      }
      
      // Check for intensifiers
      if (intensifiers.includes(word)) {
        intensified = true;
        continue;
      }
      
      // Check for diminishers
      if (diminishers.includes(word)) {
        diminished = true;
        continue;
      }
      
      // Reset modifiers after 4 words or sentence end
      if (i > 0 && (i - (negated ? 1 : 0) - (intensified ? 1 : 0) - (diminished ? 1 : 0)) > 4) {
        negated = false;
        intensified = false;
        diminished = false;
      }
      
      // Check positive words
      if (Object.prototype.hasOwnProperty.call(positiveWords, word)) {
        let score = positiveWords[word];
        
        // Apply modifiers
        if (intensified) score *= 1.5;
        if (diminished) score *= 0.5;
        
        sentenceScore += negated ? -score : score;
        wordCount++;
      }
      
      // Check negative words
      if (Object.prototype.hasOwnProperty.call(negativeWords, word)) {
        let score = negativeWords[word];
        
        // Apply modifiers
        if (intensified) score *= 1.5;
        if (diminished) score *= 0.5;
        
        sentenceScore += negated ? score : -score;
        wordCount++;
      }
    }
    
    totalScore += sentenceScore;
  });
  
  // Calculate average sentiment score
  if (wordCount === 0) return 'neutral';
  
  const averageScore = totalScore / wordCount;
  
  // More nuanced thresholds for classification
  if (averageScore > 0.5) return 'positive';
  if (averageScore < -0.5) return 'negative';
  return 'neutral';
}

// Add a new function for context-aware sentiment analysis
/**
 * Context-aware sentiment analysis with domain-specific understanding
 * @param {string} text - Text to analyze
 * @returns {string} Sentiment: 'positive', 'negative', or 'neutral'
 */
function getContextAwareSentiment(text) {
  // Domain-specific sentiment indicators for news
  const newsPositivePatterns = [
    /\b(breakthrough|innovation|discovery|achievement|success)\b/i,
    /\b(record high|surge|jump|boost|gain)\b/i,
    /\b(positive|promising|encouraging|favorable)\b/i
  ];
  
  const newsNegativePatterns = [
    /\b(crisis|emergency|disaster|collapse|plunge)\b/i,
    /\b(record low|slump|drop|loss|decline)\b/i,
    /\b(negative|concerning|alarming|disturbing)\b/i,
    /\b(warning|threat|risk|danger)\b/i
  ];
  
  let contextScore = 0;
  
  // Check for domain-specific patterns
  newsPositivePatterns.forEach(pattern => {
    if (pattern.test(text)) contextScore += 1;
  });
  
  newsNegativePatterns.forEach(pattern => {
    if (pattern.test(text)) contextScore -= 1;
  });
  
  // Combine with rule-based analysis
  const ruleBasedSentiment = getEnhancedRuleBasedSentiment(text);
  let finalSentiment = ruleBasedSentiment;
  
  // Adjust based on context if there's a strong signal
  if (contextScore > 1 && ruleBasedSentiment === 'neutral') {
    finalSentiment = 'positive';
  } else if (contextScore < -1 && ruleBasedSentiment === 'neutral') {
    finalSentiment = 'negative';
  }
  
  return finalSentiment;
}

module.exports = {
  safeFetch,
  generateId,
  normalizeDate,
  sanitizeHTML,
  normalizeUrl,
  dedupeByUrl,
  extractSummary,
  getEnhancedContent,
  analyzeSentiment,
  Sentiment,
  // Export enhanced fallback functions for testing
  getEnhancedRuleBasedSentiment,
  getContextAwareSentiment
};