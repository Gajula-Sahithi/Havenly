#!/bin/bash

# Havenly - Full Stack Vercel Deployment Script
echo "🚀 Deploying Havenly Full Stack to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the frontend directory
if [ ! -f "package.json" ] || [ ! -d "api" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Full Stack Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_PRIVATE_KEY"
echo "   - FIREBASE_CLIENT_EMAIL"
echo "   - FIREBASE_DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - GEMINI_API_KEY"
echo ""
echo "2. Your app will be available at: https://your-app-name.vercel.app"
