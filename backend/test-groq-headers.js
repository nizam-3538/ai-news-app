const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_MODEL = process.env.GROQ_API_MODEL || 'grok-4-latest';

if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY not set in backend/.env');
  process.exit(2);
}

const headersList = [
  { 'Authorization': `Bearer ${GROQ_API_KEY}` },
  { 'authorization': `Bearer ${GROQ_API_KEY}` },
  { 'OpenAI-Api-Key': GROQ_API_KEY },
  { 'openai-api-key': GROQ_API_KEY },
  { 'Api-Key': GROQ_API_KEY },
  { 'X-API-Key': GROQ_API_KEY },
  { 'x-api-key': GROQ_API_KEY }
];

(async () => {
  console.log('Testing GROQ endpoint:', GROQ_API_URL);
  for (const hdr of headersList) {
    const headerName = Object.keys(hdr)[0];
    const headers = Object.assign({ 'Content-Type': 'application/json' }, hdr);
    try {
      const resp = await axios.post(GROQ_API_URL, {
        model: GROQ_API_MODEL,
        messages: [{ role: 'user', content: 'Test key. Reply with "ok" and nothing else.' }],
        max_tokens: 1,
        temperature: 0
      }, { headers, timeout: 10000 });

      console.log('\nHEADER:', headerName, 'STATUS:', resp.status);
      try { console.log('BODY_SNIPPET:', JSON.stringify(resp.data).substring(0, 800)); } catch (e) { console.log('BODY: <unserializable>'); }
    } catch (err) {
      if (err.response) {
        console.log('\nHEADER:', headerName, 'STATUS:', err.response.status);
        try { console.log('RESPONSE_BODY_SNIPPET:', JSON.stringify(err.response.data).substring(0, 800)); } catch (e) { console.log('RESPONSE_BODY: <unserializable>'); }
      } else {
        console.log('\nHEADER:', headerName, 'ERROR:', err.message);
      }
    }
  }
})();
