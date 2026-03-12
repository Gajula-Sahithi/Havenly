# Deploy Backend to Render - Quick Guide

## Step 1: Go to Render
1. Visit https://render.com
2. Sign up/login with GitHub

## Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your repository

## Step 3: Configure Service
### Basic Settings:
- **Name**: havenly-backend
- **Environment**: Node
- **Region**: Choose nearest region
- **Branch**: main

### Build & Start Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Advanced Settings:
- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes (for automatic updates)

## Step 4: Set Environment Variables
In Environment Variables section, add:

```
FIREBASE_PROJECT_ID=dormlink-ec53d
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhIw3v2Ab6XkKC
f3vBDRZwMynXzTzXGqFlw7ojkmS2Lo2bMHYYYwKL+O15EkzLLLoJ4fd4jeAh76AG
bmsHCtvF8I5tXaymjD59dAYajHKhJ4e6cAUAEJHCr63FJnqFBv46OjcL/sxPPanw
jjvCt1H3WGbJZAiIMnBUVTdUeDaH1V6eeOHWQzdh9d9kYP4U+k8tdEaqzAsOkqwV
OG4H99V61JYt0HuMM8HK8UM83cC/zNcDJZP0eDp06qLkXUFzHARwEnEnP5OrfX/t
V/68PE2VWbxa6TwDusFUlg5/8TTHHXxZ5bIQfqDj0zu9iWngkICLyl5csnGselpd
bsAUhKhzAgMBAAECggEASGA5EEROBfn8frBWC/tVnc9M4dPYfbxRa4IvGlVrLAgu
PNgo9vEJdg8Z5KSl7GEeE6RBps9RYQeEVdz0akiq22jYmL8XDFmkkzcT6UACb91h
7GUrrlglS8WnYuxaUd6sJvLlFGWer9C+i5dmDdRaNN6F+LNAbOxuISZeCbk1qpeq
mp4H7E1ff3qLIVHZzEO7KU4Tqc1A0hlZPCY93igzoP40wsynhE3lqy9f9I0RLOMV
HZetBDeSpWNoE5cDcY2a1JDTkxnxA+0LNjNEnbgCOdc7vx9+gS0ZCp+Pds4bBveo
qUyD//VZKuBN+RbutNqnB/DUjdSK1H7hh+/GZXBtcQKBgQDzbG+fr1EVRM3x9gsf
nIwAyrw2QirBvfR19416Me1olFLlA5/BtBb+OVDFvN/BRrbpiFahockJE611pSbU
16iQgpdjzyN7iti3gnCUey3SBLjkl8BYYzXN1FirGPj9iXvgbHPj1WXnm4JeSgqL
zNr0Npl94DMp4fyofSq+rAXD8QKBgQDsxMGE9BKe9zCuSnK50OabQ3hgN4eMpo2D
F2wrO6a695rXWUgt50iih5unCdyGlCkhzJLtGXPqqyI4dMQuf1VWoUGslPLlOSIL
Ur+THhjapalxzm7Kma1bLOCxzRQOLqKH7w73jmFamCWx52EZtCmpuwjuWsPpmnAc
IA3IzpVGowKBgCFnEtYlt4mknGIEcjhPQgLlzvffEoDtcPszEg3fhgVgvRNB8Q0i
ijkuYkAQD+A0tOrM055wVebR9W58UBzKzw2tbdq7VNIiFmTwGES3tmzoSvrLPBCk
5IAvEE/CKICZ+g6ssyZjZQ1oEHah0FqorK7wQxW7yymHIiV4r4HklxHxAoGAPw98
nd1vGZd5ycclUWxc/hFTpB79ic9ycTjD711vw4VU3QWn/JnK2TsuNcmTW/mURu3XQ
ICQqUnM4Dw9SfQve/869PikBtHmODrQAYD+g4QNEaRJRQdbCbEk8oz56u/hBw7Cx
LNAYL9fcGlEE9KKegh1VmJ5GFb7TYzpKUZRr/78CgYEArye5BTKgjG2ZtC0HIOHG
DLm/KNJc2ZUBRxuaSFe8/wL2Y85AXLzapzbCqsgrQ1sQf92dXjlN+k5ztJ41rb1v
htTtniwvvol1HITN8E72WoMET65Kel2jBnj5YmoUSeIZPqtPYnA+HP0CRvZH5NTI
0PLcM2vKXoKy28sylkSNEQE=
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@dormlink-ec53d.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://dormlink-ec53d.firebaseio.com
JWT_SECRET=dormlink_super_secret_jwt_key_2024_secure_production
GEMINI_API_KEY=AIzaSyChBeZwGc64e3xtJuxkGk36jU-8e-njUu0
NODE_ENV=production
PORT=5000
```

## Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. You'll get a URL like: `https://havenly-backend.onrender.com`

## Step 6: Update Frontend
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_BASE_URL = https://havenly-backend.onrender.com/api`
3. Redeploy frontend: `vercel --prod --yes`

## Step 7: Test
- Backend Health: `https://havenly-backend.onrender.com/health`
- Frontend: `https://your-frontend-url.com`
- Test login and other features

## Free Tier Benefits:
- 750 hours/month (more than enough for development)
- Auto-deploys from GitHub
- SSL certificates included
- Custom domains supported

## Troubleshooting:
- If build fails, check environment variables
- Make sure Firebase credentials are correct
- Check Render logs for errors
- Health check should return JSON response
