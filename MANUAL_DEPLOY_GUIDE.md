# 🚀 Manual Vercel Deployment Guide

## Step 1: Login to Vercel

1. **Open Command Prompt** or PowerShell
2. **Navigate to project folder**:
   ```bash
   cd "c:\Users\srina\OneDrive\sahithi"
   ```
3. **Login to Vercel**:
   ```bash
   vercel login
   ```
4. **Visit the URL shown**: https://vercel.com/oauth/device?user_code=SCCQ-PTTB
5. **Complete authentication** in your browser

## Step 2: Deploy with Environment Variables

### Option A: Use the PowerShell Script (Recommended)
```bash
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### Option B: Manual Deployment
1. **Set environment variables**:
   ```bash
   $env:FIREBASE_PROJECT_ID="dormlink-ec53d"
   $env:FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@dormlink-ec53d.iam.gserviceaccount.com"
   $env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----`nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDhIw3v2Ab6XkKC`nf3vBDRZwMynXzTzXGqFlw7ojkmS2Lo2bMHYYYwKL+O15EkzLLLoJ4fd4jeAh76AG`nbmsHCtvF8I5tXaymjD59dAYajHKhJ4e6cAUAEJHCr63FJnqFBv46OjcL/sxPPanw`njjvCt1H3WGbJZAiIMnBUVTdUeDaH1V6eeOHWQzdh9d9kYP4U+k8tdEaqzAsOkqwV`nOG4H99V61JYt0HuMM8HK8UM83cC/zNcDJZP0eDp06qLkXUFzHARwEnEnP5OrfX/t`nV/68PE2VWbxa6TwDusFUlg5/8TTHHXxZ5bIQfqDj0zu9iWngkICLyl5csnGselpd`nbsAUhKhzAgMBAAECggEASGA5EEROBfn8frBWC/tVnc9M4dPYfbxRa4IvGlVrLAgu`nPNgo9vEJdg8Z5KSl7GEeE6RBps9RYQeEVdz0akiq22jYmL8XDFmkkzcT6UACb91h`n7GUrrlglS8WnYuxaUd6sJvLlFGWer9C+i5dmDdRaNN6F+LNAbOxuISZeCbk1qpeq`nmp4H7E1ff3qLIVHZzEO7KU4Tqc1A0hlZPCY93igzoP40wsynhE3lqy9f9I0RLOMV`nHZetBDeSpWNoE5cDcY2a1JDTkxnxA+0LNjNEnbgCOdc7vx9+gS0ZCp+Pds4bBveo`nqUyD//VZKuBN+RbutNqnB/DUjdSK1H7hh+/GZXBtcQKBgQDzbG+fr1EVRM3x9gsf`nnIwAyrw2QirBvfR19416Me1olFLlA5/BtBb+OVDFvN/BRrbpiFahockJE611pSbU`n16iQgpdjzyN7iti3gnCUey3SBLjkl8BYYzXN1FirGPj9iXvgbHPj1WXnm4JeSgqL`nzNr0Npl94DMp4fyofSq+rAXD8QKBgQDsxMGE9BKe9zCuSnK50OabQ3hgN4eMpo2D`nF2wrO6a695rXWUgt50iih5unCdyGlCkhzJLtGXPqqyI4dMQuf1VWoUGslPLlOSIL`nUr+THhjapalxzm7Kma1bLOCxzRQOLqKH7w73jmFamCWx52EZtCmpuwjuWsPpmnAc`nIA3IzpVGowKBgCFnEtYlt4mknGIEcjhPQgLlzvffEoDtcPszEg3fhgVgvRNB8Q0i`nijkuYkAQD+A0tOrM055wVebR9W58UBzKzw2tbdq7VNIiFmTwGES3tmzoSvrLPBCk`n5IAvEE/CKICZ+g6ssyZjZQ1oEHah0FqorK7wQxW7yymHIiV4r4HklxHxAoGAPw98`nd1vGZd5ycclUWxc/hFTpB79ic9ycTjD711vw4VU3QWn/JnK2TsuNcmTW/mURu3XQ`nICQqUnM4Dw9SfQve/869PikBtHmODrQAYD+g4QNEaRJRQdbCbEk8oz56u/hBw7Cx`nLNAYL9fcGlEE9KKegh1VmJ5GFb7TYzpKUZRr/78CgYEArye5BTKgjG2ZtC0HIOHG`nDLm/KNJc2ZUBRxuaSFe8/wL2Y85AXLzapzbCqsgrQ1sQf92dXjlN+k5ztJ41rb1v`nhtTtniwvvol1HITN8E72WoMET65Kel2jBnj5YmoUSeIZPqtPYnA+HP0CRvZH5NTI`n0PLcM2vKXoKy28sylkSNEQE=`n-----END PRIVATE KEY-----`n"
   $env:FIREBASE_DATABASE_URL="https://dormlink-ec53d.firebaseio.com"
   $env:JWT_SECRET="dormlink_super_secret_jwt_key_2024_secure_production"
   $env:GEMINI_API_KEY="AIzaSyChBeZwGc64e3xtJuxkGk36jU-8e-njUu0"
   ```

2. **Deploy**:
   ```bash
   vercel --prod --yes
   ```

## Step 3: Alternative - Use Vercel Dashboard

1. **Go to**: https://vercel.com
2. **Click**: "New Project"
3. **Connect**: Your GitHub repository
4. **Add Environment Variables** in Project Settings:
   - FIREBASE_PROJECT_ID: dormlink-ec53d
   - FIREBASE_CLIENT_EMAIL: firebase-adminsdk-fbsvc@dormlink-ec53d.iam.gserviceaccount.com
   - FIREBASE_PRIVATE_KEY: [Paste the full private key with line breaks]
   - FIREBASE_DATABASE_URL: https://dormlink-ec53d.firebaseio.com
   - JWT_SECRET: dormlink_super_secret_jwt_key_2024_secure_production
   - GEMINI_API_KEY: AIzaSyChBeZwGc64e3xtJuxkGk36jU-8e-njUu0
5. **Deploy**: Click "Deploy"

## ✅ After Deployment

Your app will be live at: `https://your-project-name.vercel.app`

Test these URLs:
- **Frontend**: https://your-app.vercel.app
- **API Health**: https://your-app.vercel.app/api/health

## 🎯 Login Credentials

- **Super Admin**: gajula@gmail.com / saahithi
- **Demo Student**: student-test@havenly.com / student123

## 🎉 Your App is Ready!

All Firebase errors are fixed and your app will deploy successfully!
