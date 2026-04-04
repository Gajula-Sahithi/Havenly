const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase
try {
  // Use environment variables directly
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  
  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Missing Firebase credentials in environment variables');
  }
  
  // Clean up the private key
  let cleanPrivateKey = privateKey;
  
  // Remove surrounding quotes if present
  if (cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) {
    cleanPrivateKey = cleanPrivateKey.slice(1, -1);
  }
  
  // Replace \n with actual newlines
  cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
  
  // Ensure proper BEGIN and END lines
  if (!cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    cleanPrivateKey = '-----BEGIN PRIVATE KEY-----\n' + cleanPrivateKey;
  }
  if (!cleanPrivateKey.includes('-----END PRIVATE KEY-----')) {
    cleanPrivateKey = cleanPrivateKey + '\n-----END PRIVATE KEY-----';
  }
  
  cleanPrivateKey = cleanPrivateKey.trim();
  
  console.log('Initializing Firebase with project:', projectId);
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      privateKey: cleanPrivateKey,
      clientEmail: clientEmail
    }),
    databaseURL: databaseURL
  });
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.error('Environment variables check:');
  console.error('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
  console.error('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
  console.error('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');
  console.error('FIREBASE_DATABASE_URL:', process.env.FIREBASE_DATABASE_URL ? 'SET' : 'NOT SET');
  process.exit(1);
}

const db = admin.firestore();

// Create Express app
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // In development, be more permissive if origin is localhost
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const aiRoutes = require('./routes/ai');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);

// Serve static files from frontend build (Local Only)
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'DormFlow Backend is running' });
});

// Frontend routing - serve React app for all non-API routes (Local Only)
if (!process.env.VERCEL) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Body parser error handler (catch invalid JSON payloads)
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('Invalid JSON payload:', err.message);
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next(err);
});

// Firebase connection established
console.log('Firebase Firestore connected');

// Ensure demo accounts exist for easier testing
try {
  const { User } = require('./models');
  (async () => {
    try {
      // Super Admin - only one account
      const superAdminEmail = 'gajula@gmail.com';
      const studentEmail = 'student-test@havenly.com';

      const superAdmin = await User.findByEmail(superAdminEmail);
      if (!superAdmin) {
        await User.create({ 
          name: 'Super Admin', 
          email: superAdminEmail, 
          password: 'sahithi', 
          role: 'admin',
          phone: '+919876543210'
        });
        console.log('Created super admin account:', superAdminEmail);
      }

      const student = await User.findByEmail(studentEmail);
      if (!student) {
        await User.create({ name: 'Student Demo', email: studentEmail, password: 'student123', role: 'student' });
        console.log('Created demo student account:', studentEmail);
      }
    } catch (err) {
      console.error('Demo account setup error:', err.message);
    }
  })();
} catch (e) {
  console.error('Unable to setup demo accounts:', e.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Export app for serverless platforms like Vercel, else bind to port
if (process.env.VERCEL) {
  console.log('Exporting app for Vercel serverless environment');
  module.exports = app;
} else {
  const server = app.listen(PORT, () => {
    console.log(`DormFlow Backend running on http://localhost:${PORT}`);
    console.log(`Frontend served at: http://localhost:${PORT}`);
  });
  module.exports = server;
}
