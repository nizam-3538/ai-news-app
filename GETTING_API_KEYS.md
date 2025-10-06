# Getting Real API Keys for AI News Aggregator

## 1. Getting a Grok API Key

1. **Visit the Grok API Console**
   - Go to: https://console.x.ai/
   - Sign in with your X (Twitter) account

2. **Navigate to API Access**
   - Once logged in, look for "API" or "Developer" section
   - You may need to apply for API access if it's not immediately available

3. **Generate Your API Key**
   - Find the option to create a new API key
   - Give it a descriptive name like "AI News Aggregator"
   - Copy the generated key (it should start with `sk-or-v1-` and be quite long)

## 2. Getting a Google Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create Your API Key**
   - Click on "Create API key" or "+ Create API key"
   - Give it a name like "AI News Aggregator"
   - Copy the generated key (it should start with `AIzaSy` and be exactly 39 characters)

## 3. Updating Your .env File

Once you have both API keys, update your `d:\ai-news-aggregator\backend\.env` file:

1. **Open the file** in a text editor
2. **Find these lines**:
   ```env
   # Google Gemini AI Configuration (Optional - AI analysis)
   # Get your free API key from https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=AIzaSyAvEr558w9k29sCQ82rvvCutRt_MRancro

   # Grok API Configuration (Optional - AI analysis)
   # Get your API key from https://console.x.ai/
   GROK_API_KEY=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
   ```

3. **Replace with your real keys**:
   ```env
   # Google Gemini AI Configuration (Optional - AI analysis)
   # Get your free API key from https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY_HERE

   # Grok API Configuration (Optional - AI analysis)
   # Get your API key from https://console.x.ai/
   GROK_API_KEY=YOUR_REAL_GROK_API_KEY_HERE
   ```

4. **Save the file**

## 4. Restart Your Server

After updating the keys:

1. **Stop the current server** (if running):
   ```bash
   Ctrl + C
   ```

2. **Start the server again**:
   ```bash
   npm run dev
   ```

## 5. Verify Your Keys Are Working

You can test if your keys are working by running:

```bash
node simple-key-check.js
```

If both keys are valid, you should see:
- ✅ Grok API key is VALID
- ✅ Gemini API key is VALID

## Troubleshooting

If you're still having issues:

1. **Check for typos** in your API keys
2. **Make sure you copied the complete key** (especially for Grok which is very long)
3. **Verify API access** is enabled for your accounts
4. **Check rate limits** - if you've used the APIs extensively, you might need to wait

## Need Help?

If you're having trouble getting API access:
- For Grok API: API access is currently limited and you may need to apply
- For Gemini API: Make sure you're using a Google account that can access AI Studio