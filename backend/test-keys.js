const fs = require('fs');
const path = require('path');
const fetch = globalThis.fetch || require('node-fetch');

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    if (key === '__proto__') continue;
    let val = trimmed.substring(idx + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'"') && val.endsWith("'"'))) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
  return env;
}

(async () => {
  const envPath = path.join(__dirname, '.env');
  const env = parseDotEnv(envPath);

  const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  // Note: legacy GROK env var removed from project; only GROQ_API_KEY is supported
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const groqUrl = env.GROQ_API_URL || process.env.GROQ_API_URL || 'https://api.x.ai/v1/chat/completions';
  const groqHeaderName = env.GROQ_API_HEADER_NAME || process.env.GROQ_API_HEADER_NAME || 'Authorization';
  const groqAuthScheme = env.GROQ_API_AUTH_SCHEME || process.env.GROQ_API_AUTH_SCHEME || 'Bearer';

  function mask(k) {
    if (!k) return 'NOT SET';
    return k.length > 10 ? `${k.substring(0,6)}...${k.slice(-4)}` : k;
  }

  console.log('Found keys:' );
  console.log('GROQ_API_KEY:', mask(groqKey));
  console.log('GEMINI_API_KEY:', mask(geminiKey));
  console.log('GROQ_API_URL:', groqUrl);
  console.log('GROQ header:', groqHeaderName, groqAuthScheme);

  // Test Google Generative Language API by listing models
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`;
      console.log('\nTesting Gemini API (models.list)...');
      const r = await fetch(url, { method: 'GET' });
      console.log('Gemini status:', r.status);
      const txt = await r.text();
      console.log('Gemini response (first 1000 chars):\n', txt.substring(0, 1000));
    } catch (err) {
      console.error('Gemini test failed:', err.message);
    }
  } else {
    console.log('\nSkipping Gemini test: key not set');
  }

  // Test GROQ API by hitting GROQ_API_URL with proper header
  if (groqKey) {
    try {
      console.log('\nTesting GROQ API (configured URL)...');
      const headers = { 'Content-Type': 'application/json' };
      if (groqHeaderName === '__proto__' || groqHeaderName === 'constructor' || groqHeaderName === 'prototype') {
        console.error('Invalid header name');
      } else if (groqHeaderName === 'Authorization') {
        headers['Authorization'] = `${groqAuthScheme} ${groqKey}`;
      } else {
        headers[groqHeaderName] = groqKey;
      }

      // Try a POST with a tiny prompt to get authentication / schema errors
      const postBody = JSON.stringify({ model: process.env.GROQ_API_MODEL || 'groq-1', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 });
      const r = await fetch(groqUrl, { method: 'POST', headers, body: postBody });
      console.log('GROQ status:', r.status);
      const txt = await r.text();
      console.log('GROQ response (first 1000 chars):\n', txt.substring(0, 1000));

    } catch (err) {
      console.error('GROQ test failed:', err.message);
    }
  } else {
    console.log('\nSkipping GROQ test: key not set');
  }

  console.log('\nDone.');
})();
