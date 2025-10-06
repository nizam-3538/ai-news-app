# 🔧 Quick Setup Guide

## 🚀 **STEP 1: Get Google OAuth Working (2 minutes)**

### A. Google Cloud Console Setup:
1. Go to: https://console.cloud.google.com/
2. Create new project: "ai-news-aggregator"
3. Enable Google+ API:
   - APIs & Services > Library
   - Search "Google+ API" > Enable
4. Create OAuth credentials:
   - APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized origins: `http://localhost:3000`, `https://yourdomain.com`
   - Download JSON or copy Client ID

### B. Update Your Files:
Replace `GOOGLE_CLIENT_ID` in:
- `frontend/login.html` (line ~142)
- `frontend/signup.html` (similar location)
- Add to `backend/.env`:
```
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret
```

---

## 🌐 **STEP 2: Deploy to Vercel (3 minutes)**

### Install Vercel CLI:
```bash
npm install -g vercel
```

### Deploy Backend:
```bash
cd backend
vercel
# Follow prompts, say 'Y' to everything
```

### Deploy Frontend:
```bash
cd frontend  
vercel
# Follow prompts, say 'Y' to everything
```

### Update Frontend URL:
After backend deploys, update `frontend/auth.js` line 9:
```javascript
API_BASE_URL: window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://your-actual-backend-url.vercel.app', // PUT YOUR REAL URL HERE
```

Then redeploy frontend:
```bash
cd frontend && vercel --prod
```

---

## 📋 **Alternative: Render.com (One-Click Deploy)**

1. Go to: https://render.com/
2. Connect GitHub
3. Deploy backend as "Web Service"
4. Deploy frontend as "Static Site"  
5. Add environment variables in dashboard

---

## ✅ **STEP 3: Test Everything**

Your live app will have:
- ✅ News aggregation working
- ✅ AI chatbot working  
- ✅ User registration/login
- ✅ Google OAuth login
- ✅ Favorites with 50-item limit
- ✅ Database storage

---

## 🔑 **Environment Variables Checklist**

Make sure these are set in your hosting dashboard:

```bash
# Required for OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Already working
MONGODB_URI=mongodb+srv://jhonsimon4132_db_user:mAn9n1eL31FGSbaC@cluster1.zdxvbhh.mongodb.net/ai-news-aggregator?retryWrites=true&w=majority&appName=Cluster1
GEMINI_API_KEY=AIzaSyAg4SK4RtMR4Ghe3mZ2iL2gfso3v8tJnVQ
NEWSDATA_API_KEY=pub_43618efa2bbc4becb20abc69832a216d
JWT_SECRET=3ad5be881d732cbde7afe7b6e404d8f7653b82394c453483421f894ad583078756ee66e5ef1774835d57cc8c93f3b8bfc8a78766e7f62c2e190a9d1645b1ce9a

# Update for production
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app
```

---

## 🎯 **Expected Result**

After deployment, you'll have a fully functional news app with:
- Live URL (e.g., `https://ai-news-aggregator.vercel.app`)
- Google OAuth working
- All features functional
- Database persisting user data
- 50-article favorites limit per user

**Total time: ~5 minutes** ⚡