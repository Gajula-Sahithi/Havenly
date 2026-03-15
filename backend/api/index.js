require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase (same as your main server)
try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  
  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Missing Firebase credentials');
  }
  
  let cleanPrivateKey = privateKey;
  if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
    cleanPrivateKey = cleanPrivateKey.slice(1, -1);
  }
  cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
  
  if (!cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    cleanPrivateKey = '-----BEGIN PRIVATE KEY-----\n' + cleanPrivateKey;
  }
  if (!cleanPrivateKey.includes('-----END PRIVATE KEY-----')) {
    cleanPrivateKey = cleanPrivateKey + '\n-----END PRIVATE KEY-----';
  }
  cleanPrivateKey = cleanPrivateKey.trim();
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      privateKey: cleanPrivateKey,
      clientEmail: clientEmail
    }),
    databaseURL: databaseURL
  });
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Import routes
const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');
const studentRoutes = require('../routes/student');
const aiRoutes = require('../routes/ai');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Havenly API is running' });
});

// Catch-all handler - serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Export for Vercel
module.exports = app;
