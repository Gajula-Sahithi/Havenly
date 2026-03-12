# Backend Deployment Guide

## Option 1: Railway (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Select the `backend` folder or root repository
5. Railway will automatically detect it's a Node.js app

### Step 3: Set Environment Variables
In Railway dashboard → Settings → Variables:
```
FIREBASE_PROJECT_ID=dormlink-ec53d
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@dormlink-ec53d.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://dormlink-ec53d.firebaseio.com
JWT_SECRET=dormlink_super_secret_jwt_key_2024_secure_production
GEMINI_API_KEY=AIzaSyChBeZwGc64e3xtJuxkGk36jU-8e-njUu0
NODE_ENV=production
PORT=5000
```

### Step 4: Deploy
- Click "Deploy" button
- Railway will build and deploy your backend
- You'll get a URL like: `https://your-app-name.up.railway.app`

## Option 2: Render

### Step 1: Push to GitHub
Same as above

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New + Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

### Step 3: Set Environment Variables
Same variables as Railway

## Step 5: Update Frontend API URL

Once your backend is deployed, update the frontend:

### Option A: Update in Vercel Dashboard
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_BASE_URL = https://your-backend-url.com`
3. Redeploy frontend

### Option B: Update Locally and Redeploy
```bash
# In frontend directory
# Update src/utils/api.js
const API_BASE_URL = 'https://your-backend-url.com';

# Redeploy
vercel --prod --yes
```

## Testing

1. Backend Health Check: `https://your-backend-url.com/health`
2. Frontend: `https://your-frontend-url.com`
3. Test login and other features

## Free Tier Limits

- **Railway**: $5/month after free credits, 500 hours/month
- **Render**: Free tier with 750 hours/month
- **Heroku**: 550 hours/month (limited)

Both Railway and Render are excellent choices with generous free tiers!
