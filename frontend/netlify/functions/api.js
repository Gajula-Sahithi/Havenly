const express = require('express');
const serverless = require('serverless-http');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

// Collections
const USERS_COLLECTION = 'users';
const ROOMS_COLLECTION = 'rooms';
const COMPLAINTS_COLLECTION = 'complaints';
const TRANSACTIONS_COLLECTION = 'transactions';
const NOTICES_COLLECTION = 'notices';

// User operations
const User = {
  async create(userData) {
    const { email, password, name, role, phone } = userData;
    
    const existingUser = await db.collection(USERS_COLLECTION).where('email', '==', email).get();
    if (!existingUser.empty) {
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRef = await db.collection(USERS_COLLECTION).add({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      phone: phone || '',
      room_id: null,
      createdAt: new Date()
    });

    return { id: userRef.id, ...userData };
  },

  async findByEmail(email) {
    if (!email) return null;
    const snapshot = await db.collection(USERS_COLLECTION).where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async comparePassword(storedPassword, inputPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }
};

const app = express();
app.use(express.json());

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user || !(await User.comparePassword(user.password, password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ message: 'Registration successful', user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'API is running' });
});

module.exports.handler = serverless(app);
