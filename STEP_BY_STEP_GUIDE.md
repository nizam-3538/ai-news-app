# Step-by-Step Guide to Get API Keys

## Getting Your Google Gemini API Key

### Step 1: Visit Google AI Studio
1. Open your browser and go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account

### Step 2: Create Your API Key
1. Look for the "+ Create API key" button (usually blue)
2. Click it and give your key a name like "AI News Aggregator"
3. Click "Create"

### Step 3: Copy Your API Key
1. Your new API key will appear on screen
2. It will look like this: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456`
3. Click the copy button or manually select and copy the entire key
4. Save it in a secure location

## Getting Your Grok API Key

### Important Note About Grok API Access
The Grok API is currently in limited release and requires approval. You may need to apply first.

### Step 1: Apply for Access (If Required)
1. Go to: https://console.x.ai/
2. Sign in with your X (Twitter) account
3. Look for API access options
4. Fill out any required application forms
5. Wait for approval (can take hours to days)

### Step 2: Generate Your API Key
1. Once approved, go back to https://console.x.ai/
2. Navigate to the API section
3. Look for "API Keys" or "Developer" section
4. Click "Create new key" or similar
5. Give it a name like "AI News Aggregator"
6. Click "Create"

### Step 3: Copy Your API Key
1. Your new API key will appear on screen
2. It will look like this: `sk-or-v1-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`
3. It's very long (60+ characters)
4. Click the copy button or manually select and copy the entire key
5. Save it in a secure location

## Updating Your Configuration File

### Step 1: Open the .env File
1. Navigate to: `d:\ai-news-aggregator\backend\.env`
2. Open it with a text editor (Notepad, VS Code, etc.)

### Step 2: Locate the API Key Sections
Find these lines:
```env
# Google Gemini AI Configuration (Optional - AI analysis)
# Get your free API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyAvEr558w9k29sCQ82rvvCutRt_MRancro

# Grok API Configuration (Optional - AI analysis)
# Get your API key from https://console.x.ai/
GROK_API_KEY=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
```

### Step 3: Replace with Your Real Keys
Replace the placeholder keys with your actual keys:
```env
# Google Gemini AI Configuration (Optional - AI analysis)
# Get your free API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY_HERE

# Grok API Configuration (Optional - AI analysis)
# Get your API key from https://console.x.ai/
GROK_API_KEY=YOUR_REAL_GROK_API_KEY_HERE
```

### Step 4: Save the File
1. Press Ctrl+S or go to File > Save
2. Close the text editor

## Restarting Your Application

### Step 1: Stop the Current Server
1. Go to your terminal/command prompt where the server is running
2. Press Ctrl+C to stop the server

### Step 2: Start the Server Again
1. In the same terminal, run:
```bash
npm run dev
```

## Verifying Your Keys Work

### Run the Verification Script
After updating your keys, run:
```bash
node verify-keys.js
```

You should see output like:
```
✅ Grok API key is VALID
✅ Gemini API key is VALID
```

If you see any errors, double-check:
1. You copied the complete keys correctly
2. There are no extra spaces before or after the keys
3. The keys are pasted in the correct lines
4. You saved the file after making changes

## Troubleshooting Common Issues

### Issue 1: Keys Still Show as Invalid
- Make sure you replaced the entire placeholder key, not just part of it
- Check for extra spaces before or after the key
- Ensure you saved the file after making changes

### Issue 2: Grok API Access Denied
- You may still be waiting for approval
- Check your email for approval notifications
- The Grok API is currently in limited release

### Issue 3: Gemini API Rate Limit (429 Error)
- You may have exceeded usage limits
- Wait for a while and try again
- Google may have temporary rate limits

## Need More Help?

If you're still having trouble:
1. Share the exact error messages you're seeing
2. Double-check that you've followed all steps exactly
3. Make sure you're using the correct accounts for each service