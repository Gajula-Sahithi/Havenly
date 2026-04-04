const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'idproof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// Register/Sign Up
router.post('/register', upload.single('idProof'), async (req, res) => {
  try {
    console.log('Register payload:', req.body);
    const { name, email, password, role, phone, idProofType } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields: name, email, password' });
    }

    let idProofUrl = '';
    if (req.file) {
      idProofUrl = req.file.filename;
      console.log('ID proof uploaded:', idProofUrl);
    }

    // Create new user
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role, 
      phone,
      idProofType: idProofType || '',
      idProofUrl
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        room_id: null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login payload:', req.body);
    console.log('Login body type:', typeof req.body, 'keys:', Object.keys(req.body || {}));
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials: email and password are required' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await User.comparePassword(user.password, password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        room_id: user.room_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdWithRoom(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Step 1: Get Security Question
router.post('/forgot-password/question', async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.securityQuestion) {
      return res.status(400).json({ message: 'No security question set for this user' });
    }
    res.json({ securityQuestion: user.securityQuestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Step 2: Verify Answer and Reset
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { identifier, answer, newPassword } = req.body;
    const isValid = await User.verifySecurityAnswer(identifier, answer);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect answer' });
    }

    const user = await User.findByIdentifier(identifier);
    await User.resetPassword(user.id, newPassword);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
