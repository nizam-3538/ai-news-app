/**
 * Simple test for enhanced fallback functionality
 */

// Simple test function for extractive fallback
function enhancedExtractiveFallback(articleText, question) {
  try {
    // Preprocess text
    const cleanText = articleText.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    
    // Enhanced question processing
    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(word => word.length > 2);
    
    // Remove common stop words
    const stopWords = new Set(['what', 'when', 'where', 'why', 'how', 'who', 'which', 'whose', 'whom', 
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    const keywords = questionWords.filter(word => !stopWords.has(word) && word.length > 2);
    
    // Score sentences based on keyword matching and position
    const scoredSentences = sentences.map((sentence, index) => {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;
      
      // Keyword matching score
      keywords.forEach(keyword => {
        if (sentenceLower.includes(keyword)) {
          score += 3;
        }
      });
      
      // Position bonus (earlier sentences are often more important)
      const positionBonus = Math.max(0, 5 - Math.floor(index / 3));
      score += positionBonus;
      
      // Length penalty (very short sentences are less useful)
      if (sentence.length < 30) {
        score -= 2;
      }
      
      return {
        sentence,
        score,
        index
      };
    });
    
    // Sort by score and get top sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    const topSentences = scoredSentences.slice(0, 3);
    
    // Generate answer
    let answer;
    if (topSentences.length > 0 && topSentences[0].score > 0) {
      answer = topSentences.map(s => s.sentence).join('. ') + '.';
    } else {
      // Fallback to first few sentences if no good matches
      answer = sentences.slice(0, 2).join('. ') + '.';
    }
    
    // Extract supporting evidence
    const supporting = topSentences.map((item, idx) => ({
      offset: item.index,
      text: item.sentence.substring(0, 200) + (item.sentence.length > 200 ? '...' : '')
    }));
    
    return {
      answer: answer || 'Unable to find relevant information in the article.',
      supporting: supporting.length > 0 ? supporting : [
        {
          offset: 0,
          text: sentences[0] ? sentences[0].substring(0, 200) + (sentences[0].length > 200 ? '...' : '') : 'No content available'
        }
      ]
    };
    
  } catch (error) {
    console.error('Enhanced extractive fallback failed:', error.message);
    // Ultimate fallback
    return {
      answer: 'Unable to analyze the article due to processing error. Please try again later.',
      supporting: []
    };
  }
}

// Test data
const sampleArticle = `
Scientists have made a groundbreaking discovery in renewable energy technology. 
Researchers at MIT have developed a new solar panel that is 50% more efficient than current models. 
This breakthrough could revolutionize the clean energy industry and significantly reduce carbon emissions. 
The new panels use a novel nanotechnology approach that captures a broader spectrum of light. 
Initial tests show remarkable results, with energy output increasing substantially even in low-light conditions. 
Environmental groups are praising this development as a major step forward in combating climate change. 
The technology is expected to be commercially available within the next two years. 
Experts predict this innovation will make solar power more accessible to communities worldwide.
`;

const sampleQuestion = 'What is the breakthrough discovery?';

console.log('Testing Enhanced Extractive Fallback:');
console.log('====================================');
console.log(`Question: "${sampleQuestion}"`);

const result = enhancedExtractiveFallback(sampleArticle, sampleQuestion);
console.log(`\nAnswer: ${result.answer}`);
console.log(`\nSupporting evidence (${result.supporting.length} sentence(s)):`);
result.supporting.forEach((item, index) => {
  console.log(`${index + 1}. ${item.text}`);
});

console.log('\n✅ Enhanced fallback test complete!');