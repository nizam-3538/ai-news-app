# API Key Setup Checklist

## Google Gemini API Key

### ☐ Step 1: Access Google AI Studio
- [ ] Open browser and go to https://aistudio.google.com/app/apikey
- [ ] Sign in with your Google account

### ☐ Step 2: Create API Key
- [ ] Click "+ Create API key" button
- [ ] Give it a name (e.g., "AI News Aggregator")
- [ ] Click "Create"
- [ ] Copy the generated key (39 characters starting with AIzaSy)

### ☐ Step 3: Verify Key Format
- [ ] Key starts with "AIzaSy"
- [ ] Key is exactly 39 characters long
- [ ] Key doesn't contain "AvEr55" (placeholder indicator)

## Grok API Key

### Important: Grok API Access is Limited
The Grok API is currently in limited release and requires approval.

### ☐ Step 1: Apply for Access (If Needed)
- [ ] Go to https://console.x.ai/
- [ ] Sign in with your X (Twitter) account
- [ ] Look for API access/application options
- [ ] Complete any required application forms
- [ ] Wait for approval email

### ☐ Step 2: Generate API Key (After Approval)
- [ ] Go back to https://console.x.ai/
- [ ] Navigate to API section
- [ ] Click "Create new key" or similar
- [ ] Give it a name (e.g., "AI News Aggregator")
- [ ] Copy the generated key (very long, starts with sk-or-v1-)

### ☐ Step 3: Verify Key Format
- [ ] Key starts with "sk-or-v1-"
- [ ] Key is 60+ characters long
- [ ] Key doesn't contain "e0b1a07" (placeholder indicator)

## Update Configuration

### ☐ Step 1: Edit .env File
- [ ] Open `d:\ai-news-aggregator\backend\.env` in a text editor
- [ ] Find the Gemini API key line:
  ```env
  GEMINI_API_KEY=AIzaSyAvEr558w9k29sCQ82rvvCutRt_MRancro
  ```
- [ ] Replace with your real key:
  ```env
  GEMINI_API_KEY=YOUR_REAL_39_CHARACTER_KEY_HERE
  ```
- [ ] Find the Grok API key line:
  ```env
  GROK_API_KEY=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
  ```
- [ ] Replace with your real key:
  ```env
  GROK_API_KEY=YOUR_VERY_LONG_SK_KEY_HERE
  ```

### ☐ Step 2: Save and Restart
- [ ] Save the .env file
- [ ] Stop the server (Ctrl+C)
- [ ] Start the server: `npm run dev`

## Verify Setup

### ☐ Step 1: Check Key Formats
```bash
node key-format-checker.js
```
Expected output: "✅ Both API keys have correct formats!"

### ☐ Step 2: Test API Keys
```bash
node verify-keys.js
```
Expected output: "✅ Grok API key is VALID" and "✅ Gemini API key is VALID"

## Troubleshooting

### If Keys Still Show as Invalid:
- [ ] Double-check you copied the complete keys
- [ ] Ensure no extra spaces before/after keys
- [ ] Verify keys are in the correct lines in .env file
- [ ] Confirm you saved the .env file after editing

### If Getting "Rate Limit" Errors:
- [ ] Wait 24 hours and try again
- [ ] Check if you've exceeded free tier limits
- [ ] Consider using only one API key if both aren't necessary

### If Grok API Access is Denied:
- [ ] You may still be waiting for approval
- [ ] Check email for approval notifications
- [ ] The API may be temporarily unavailable

## Success Confirmation
When complete, you should see:
- [ ] "✅ Both API keys have correct formats!" from key-format-checker.js
- [ ] "✅ Grok API key is VALID" from verify-keys.js
- [ ] "✅ Gemini API key is VALID" from verify-keys.js
- [ ] AI features working in your news aggregator application