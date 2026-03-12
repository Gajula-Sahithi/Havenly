# Netlify + Render Deployment Guide
**Frontend on Netlify + Backend on Render**

## 🚀 Why This Setup is Best

✅ **Performance**: Netlify CDN + Render backend = Fast  
✅ **Reliability**: Two specialized platforms  
✅ **Free Tier**: Generous limits on both  
✅ **Management**: Easy to manage separately  
✅ **Scalability**: Can scale each component independently  

---

## Step 1: Deploy Backend to Render

### Go to Render
1. Visit https://render.com
2. Sign up/login with GitHub
3. Click "New + Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: havenly-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### Set Environment Variables
In Render dashboard → Settings → Environment Variables:
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

### Deploy
- Click "Create Web Service"
- Wait 2-3 minutes
- Get URL: `https://havenly-backend.onrender.com`

---

## Step 2: Deploy Frontend to Netlify

### Method 1: Drag & Drop (Easiest)
1. Go to https://netlify.com
2. Drag `frontend/dist` folder to the deploy area
3. Drop it
4. Your site will be live instantly

### Method 2: GitHub Integration
1. Connect your GitHub repository
2. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Set Environment Variables
In Netlify dashboard → Site settings → Environment variables:
```
VITE_API_BASE_URL=https://havenly-backend.onrender.com/api
```

### Deploy
- Click "Deploy site"
- Wait 1-2 minutes
- Get URL: `https://your-site-name.netlify.app`

---

## Step 3: Test Full Application

### Health Checks
1. **Backend**: https://havenly-backend.onrender.com/health
2. **Frontend**: https://your-site-name.netlify.app

### Test Features
1. **Login/Register** with demo accounts
2. **Room booking** and payment flow
3. **Complaints** with all categories
4. **Room changes** and notices
5. **Admin dashboard** functionality

---

## 🎯 Expected URLs

- **Backend**: https://havenly-backend.onrender.com
- **Frontend**: https://your-site-name.netlify.app
- **API**: https://havenly-backend.onrender.com/api

---

## 📱 Benefits of This Setup

✅ **Fast CDN**: Netlify's global edge network  
✅ **Reliable Backend**: Render's Node.js hosting  
✅ **Free Tier**: 750 hours/month on Render  
✅ **Auto Deployments**: Both platforms support it  
✅ **SSL Included**: HTTPS on both platforms  
✅ **Easy Management**: Separate dashboards  
✅ **Scalable**: Scale frontend/backend independently  

---

## 🔧 Files I've Prepared

✅ **Render Config**: `render.yaml`  
✅ **Netlify Config**: `netlify.toml`  
✅ **Package Updated**: Added Netlify CLI  
✅ **Functions Ready**: Basic API functions  
✅ **Environment Guide**: Step-by-step instructions  

**Your application will be fully deployed and functional within 10 minutes! 🚀**
