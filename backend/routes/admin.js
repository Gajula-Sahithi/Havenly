const express = require('express');
const multer = require('multer');
const path = require('path');
const { Room, User, Complaint, Transaction, Notice, RoomChange, db, USERS_COLLECTION, ROOMS_COLLECTION, COMPLAINTS_COLLECTION, TRANSACTIONS_COLLECTION, NOTICES_COLLECTION } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const admin = require('firebase-admin');

const router = express.Router();

// Configure multer for in-memory storage (Vercel compatible)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware
router.use(authenticate);
router.use(authorize(['admin']));

// GET all rooms with residents and payment status
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.findAll();
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const roomWithResidents = await Room.findWithResidents(room.id);
        const roomWithPaymentStatus = await Room.findWithPaymentStatus(room.id);
        
        // Merge both results
        return {
          ...roomWithResidents,
          ...roomWithPaymentStatus
        };
      })
    );
    
    console.log('=== ROOMS DATA SENT TO FRONTEND ===');
    roomsWithDetails.forEach(room => {
      console.log(`Room ${room.room_number}: paymentStatus=${room.paymentStatus}, occupancy=${room.occupancy}, pending=${room.totalPending}`);
    });
    
    res.json(roomsWithDetails);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE a new room
router.post('/rooms', upload.single('photo'), async (req, res) => {
  try {
    const { room_number, wing, type, price, capacity } = req.body;
    
    // Handle photo URL
    let photo_url = null;
    if (req.file) {
      // Convert buffer to Base64 data URI
      const base64Data = req.file.buffer.toString('base64');
      photo_url = `data:${req.file.mimetype};base64,${base64Data}`;
      console.log('Room photo processed as Base64');
    } else if (req.body.photo_url) {
      // If photo_url was provided in form data (for external URLs)
      photo_url = req.body.photo_url;
    }
    
    const room = await Room.create({ 
      room_number, 
      wing, 
      type, 
      price, 
      capacity, 
      photo_url 
    });
    
    console.log('Room created successfully:', room);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE room
router.put('/rooms/:id', upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle photo upload
    if (req.file) {
      // Convert buffer to Base64 data URI
      const base64Data = req.file.buffer.toString('base64');
      updateData.photo_url = `data:${req.file.mimetype};base64,${base64Data}`;
      console.log('Room photo updated as Base64');
    }
    
    const room = await Room.update(req.params.id, updateData);
    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE room
router.delete('/rooms/:id', async (req, res) => {
  try {
    await Room.delete(req.params.id);
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all complaints (active only - excludes complaints resolved > 24h ago)
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.findActive();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all complaints history (includes all complaints)
router.get('/complaints-history', async (req, res) => {
  try {
    const complaints = await Complaint.findHistory();
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE complaint status
router.put('/complaints/:id', async (req, res) => {
  try {
    console.log('Update complaint payload:', req.body);
    const { status, assignedTo } = req.body;
    const complaint = await Complaint.update(req.params.id, { status, assignedTo });
    
    // Enrich with user data
    const user = await User.findById(complaint.user_id);
    res.json({
      ...complaint,
      user_id: user ? { id: user.id, name: user.name, email: user.email } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE transaction status
router.put('/transactions/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.update(req.params.id, { status });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET transactions by room
router.get('/transactions-by-room', async (req, res) => {
  try {
    const rooms = await Room.findAll();
    const roomTransactions = await Promise.all(
      rooms.map(async (room) => {
        const transactions = await Transaction.findByRoomId(room.id);
        const roomWithPaymentStatus = await Room.findWithPaymentStatus(room.id);
        
        const totalDues = transactions
          .filter(t => t.status === 'Pending')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          room: {
            ...room,
            ...roomWithPaymentStatus
          },
          transactions,
          totalDues
        };
      })
    );
    res.json(roomTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE notice
router.post('/notices', async (req, res) => {
  try {
    const { title, content, expires_at, priority } = req.body;
    const notice = await Notice.create({ 
      title, 
      content, 
      expires_at,
      priority,
      createdBy: req.user.id 
    });
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all notices
router.get('/notices', async (req, res) => {
  try {
    const notices = await Notice.findAll(null, true);
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const rooms = await Room.findAll();
    const totalRooms = rooms.length;
    
    const usersSnapshot = await db.collection(USERS_COLLECTION).where('room_id', '!=', null).get();
    const occupiedRooms = usersSnapshot.size;
    
    const complaints = await Complaint.findAll();
    const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
    
    const transactions = await Transaction.findAll();
    const paidTransactions = transactions.filter(t => t.status === 'Paid' && t.paidDate);
    const pendingTransactions = transactions.filter(t => t.status === 'Pending');

    // Calculate revenue from actual paid transactions only - ensure numbers
    const revenueCollected = paidTransactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      console.log(`Adding transaction amount: ${t.amount} -> ${amount}`);
      return sum + amount;
    }, 0);
    
    const pendingDues = pendingTransactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      console.log(`Adding pending amount: ${t.amount} -> ${amount}`);
      return sum + amount;
    }, 0);

    console.log(`Final revenue: ${revenueCollected}, pending: ${pendingDues}`);

    res.json({
      occupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      pendingComplaints,
      revenueCollected: Math.round(revenueCollected * 100) / 100, // Round to 2 decimal places
      pendingDues: Math.round(pendingDues * 100) / 100,
      totalRooms,
      occupiedRooms
    });
  } catch (error) {
    console.error('Stats calculation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET all users (Super Admin functionality)
router.get('/users', async (req, res) => {
  try {
    const usersSnapshot = await db.collection(USERS_COLLECTION).get();
    const users = [];
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const user = {
        id: doc.id,
        ...userData
      };
      
      // Fetch room details if user has a room
      if (userData.room_id) {
        const roomDoc = await db.collection(ROOMS_COLLECTION).doc(userData.room_id).get();
        user.room_id = roomDoc.exists ? { id: roomDoc.id, ...roomDoc.data() } : null;
      }
      
      users.push(user);
    }
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE user (Super Admin functionality)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Prevent deletion of the last admin
    if (userData.role === 'admin') {
      const adminCount = await db.collection(USERS_COLLECTION).where('role', '==', 'admin').get();
      if (adminCount.size <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }
    
    // If user has a room, update room occupancy
    if (userData.room_id) {
      await db.collection(ROOMS_COLLECTION).doc(userData.room_id).update({
        occupancy: admin.firestore.FieldValue.increment(-1)
      });
    }
    
    // Delete user's transactions
    const transactionsSnapshot = await db.collection(TRANSACTIONS_COLLECTION).where('user_id', '==', userId).get();
    const batch = db.batch();
    transactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's complaints
    const complaintsSnapshot = await db.collection(COMPLAINTS_COLLECTION).where('user_id', '==', userId).get();
    complaintsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the user
    batch.delete(db.collection(USERS_COLLECTION).doc(userId));
    
    await batch.commit();
    
    console.log(`User ${userId} deleted successfully`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reset user password (Super Admin/Admin functionality)
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    await User.resetPassword(userId, newPassword);
    
    console.log(`Password for user ${userId} reset successfully by admin`);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET all room change requests
router.get('/room-changes', async (req, res) => {
  try {
    const requests = await RoomChange.findAll();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE room change request status
router.put('/room-changes/:id', async (req, res) => {
  try {
    const { status, admin_comment } = req.body;
    const request = await RoomChange.update(req.params.id, { status, admin_comment });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DEBUG: GET all users raw
router.get('/users-debug', async (req, res) => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION).get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
