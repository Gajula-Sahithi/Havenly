require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ message: 'Havenly API is running', status: 'ok' });
});

// Debug endpoint
app.get('/debug-env', (req, res) => {
  res.json({
    projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
    databaseURL: process.env.FIREBASE_DATABASE_URL ? 'SET' : 'NOT SET',
    jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    geminiKey: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET'
  });
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API routes before catch-all
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Catch-all handler - serve React app or fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
  
  // Check if the file exists, if not return a simple response
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.log('Frontend build not found, serving fallback');
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Havenly - Hostel Management</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .status { color: #4CAF50; font-weight: bold; }
            .error { color: #f44336; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏠 Havenly</h1>
            <h2>Hostel Management System</h2>
            <div class="status">✅ Backend API is Running</div>
            <p>Frontend build is being prepared...</p>
            <div>
              <h3>Available Endpoints:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><a href="/health">🔍 Health Check</a></li>
                <li><a href="/debug-env">🔧 Debug Environment</a></li>
                <li><a href="/api/test">🚀 API Test</a></li>
              </ul>
            </div>
            <p class="error">Frontend build files are missing. This will be fixed automatically.</p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// Export for Vercel
module.exports = app;
