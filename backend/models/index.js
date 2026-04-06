const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Lazy initialize firestore to prevent race conditions during require-chain
const getDb = () => {
  try {
    return admin.firestore();
  } catch (e) {
    console.error("Firestore initialization failed:", e.message);
    return null;
  }
};
const db = getDb();

// Collections
const USERS_COLLECTION = 'users';
const ROOMS_COLLECTION = 'rooms';
const COMPLAINTS_COLLECTION = 'complaints';
const TRANSACTIONS_COLLECTION = 'transactions';
const NOTICES_COLLECTION = 'notices';
const ACKNOWLEDGMENTS_COLLECTION = 'acknowledgments';
const ROOM_CHANGES_COLLECTION = 'room_changes';

// ===================== USER OPERATIONS =====================
const User = {
  async create(userData) {
    const { email, password, name, role, phone, idProofType, idProofUrl, securityQuestion, securityAnswer } = userData;
    
    // Check if user exists
    const existingUser = await db.collection(USERS_COLLECTION).where('email', '==', email).get();
    if (!existingUser.empty) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRef = await db.collection(USERS_COLLECTION).add({
      name,
      email,
      phone: phone || '',
      role: role || 'student', // Add missing role field
      password: hashedPassword,
      room_id: null,
      hotelName: '',
      idProofType: idProofType || '',
      idProofUrl: idProofUrl || '',
      securityQuestion: securityQuestion || '',
      securityAnswer: securityAnswer || '', // Should ideally be hashed
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

  async findByPhone(phone) {
    if (!phone) return null;
    const snapshot = await db.collection(USERS_COLLECTION).where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async findByIdentifier(identifier) {
    if (!identifier) return null;
    // Check if it's an email or phone number
    let user = await this.findByEmail(identifier);
    if (!user) {
      user = await this.findByPhone(identifier);
    }
    return user;
  },

  async findById(id) {
    if (!id) return null;
    const doc = await db.collection(USERS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async findByIdWithRoom(id) {
    const doc = await db.collection(USERS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    
    const userData = doc.data();
    if (userData.room_id) {
      const roomDoc = await db.collection(ROOMS_COLLECTION).doc(userData.room_id).get();
      userData.room_id = roomDoc.exists ? { id: roomDoc.id, ...roomDoc.data() } : null;
    }
    
    return { id: doc.id, ...userData };
  },

  async comparePassword(storedPassword, inputPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  },

  async update(id, updateData) {
    // Remove undefined fields to avoid Firestore errors
    const clean = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined));
    await db.collection(USERS_COLLECTION).doc(id).update(clean);
    return this.findById(id);
  },

  async resetPassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.collection(USERS_COLLECTION).doc(id).update({
      password: hashedPassword
    });
    return true;
  },

  async verifySecurityAnswer(identifier, answer) {
    const user = await this.findByIdentifier(identifier);
    if (!user || !user.securityAnswer) return false;
    return user.securityAnswer.toLowerCase() === answer.toLowerCase();
  }
};

// ===================== ROOM OPERATIONS =====================
const Room = {
  async create(roomData) {
    const { room_number, wing, type, price, capacity, photo_url } = roomData;
    
    const roomRef = await db.collection(ROOMS_COLLECTION).add({
      room_number,
      wing,
      type,
      price,
      capacity,
      occupancy: 0,
      photo_url: photo_url || '',
      createdAt: new Date()
    });

    return { id: roomRef.id, ...roomData };
  },

  async findAll() {
    const snapshot = await db.collection(ROOMS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async findById(id) {
    const doc = await db.collection(ROOMS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async update(id, updateData) {
    const clean = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined));
    await db.collection(ROOMS_COLLECTION).doc(id).update(clean);
    return this.findById(id);
  },

  async delete(id) {
    await db.collection(ROOMS_COLLECTION).doc(id).delete();
  },

  async findWithResidents(id) {
    const room = await this.findById(id);
    if (!room) return null;

    const users = await db.collection(USERS_COLLECTION).where('room_id', '==', id).get();
    const residents = users.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone
      };
    });

    return { ...room, residents };
  },

  async findWithPaymentStatus(id) {
    const room = await this.findById(id);
    if (!room) return null;

    // Get all transactions for this room
    const transactions = await db.collection(TRANSACTIONS_COLLECTION).where('room_id', '==', id).get();
    const transactionData = transactions.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate payment status
    const paidTransactions = transactionData.filter(t => t.status === 'Paid');
    const pendingTransactions = transactionData.filter(t => t.status === 'Pending');
    const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPending = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Determine room status based on payments and occupancy
    let status = 'available';
    
    // If room has residents, check payment status
    if (room.occupancy > 0) {
      if (transactionData.length === 0) {
        // Room has residents but no transactions - payment due
        status = 'payment_due';
      } else if (pendingTransactions.length > 0) {
        // Has pending payments
        status = 'payment_due';
      } else {
        // All payments are paid
        status = 'paid';
      }
    } else {
      // Room is empty - available
      status = 'available';
    }

    console.log(`Room ${room.room_number} (${room.occupancy}/${room.capacity}):`, {
      transactionCount: transactionData.length,
      paidCount: paidTransactions.length,
      pendingCount: pendingTransactions.length,
      totalPending,
      status
    });

    return {
      ...room,
      paymentStatus: status,
      totalPaid,
      totalPending,
      transactionCount: transactionData.length,
      paidTransactions: paidTransactions.length,
      pendingTransactions: pendingTransactions.length
    };
  }
};

// ===================== COMPLAINT OPERATIONS =====================
const Complaint = {
  async create(complaintData) {
    const { user_id, category, description } = complaintData;

    const complaintRef = await db.collection(COMPLAINTS_COLLECTION).add({
      user_id,
      category,
      description,
      status: 'Pending',
      date: new Date(),
      assignedTo: null
    });

    return { id: complaintRef.id, ...complaintData };
  },

  async findAll() {
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).orderBy('date', 'desc').get();
    const complaints = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const user = await User.findById(data.user_id);
      const assignedUser = data.assignedTo ? await User.findById(data.assignedTo) : null;

      complaints.push({
        id: doc.id,
        ...data,
        user_id: user ? { id: user.id, name: user.name, email: user.email } : null,
        assignedTo: assignedUser ? { id: assignedUser.id, name: assignedUser.name } : null
      });
    }
    
    return complaints;
  },

  async findById(id) {
    const doc = await db.collection(COMPLAINTS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async findByUserId(userId) {
    if (!userId) return [];
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).where('user_id', '==', userId).get();
    const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort locally by date desc to avoid requiring composite indexes in Firestore
    complaints.sort((a, b) => {
      const da = a.date ? a.date.toDate ? a.date.toDate() : new Date(a.date) : 0;
      const dbt = b.date ? b.date.toDate ? b.date.toDate() : new Date(b.date) : 0;
      return dbt - da;
    });
    return complaints;
  },

  async update(id, updateData) {
    const clean = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined));
    
    // Auto-add resolvedAt timestamp when status changes to 'Resolved'
    if (clean.status === 'Resolved') {
      clean.resolvedAt = new Date();
    }
    
    await db.collection(COMPLAINTS_COLLECTION).doc(id).update(clean);
    return this.findById(id);
  },

  // Find active complaints (exclude those resolved > 24 hours ago)
  async findActive() {
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).orderBy('date', 'desc').get();
    const complaints = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip complaints resolved more than 24 hours ago
      if (data.status === 'Resolved' && data.resolvedAt) {
        const resolvedAt = data.resolvedAt.toDate ? data.resolvedAt.toDate() : new Date(data.resolvedAt);
        if (resolvedAt < twentyFourHoursAgo) {
          continue;
        }
      }
      
      const user = await User.findById(data.user_id);
      const assignedUser = data.assignedTo ? await User.findById(data.assignedTo) : null;

      complaints.push({
        id: doc.id,
        ...data,
        user_id: user ? { id: user.id, name: user.name, email: user.email } : null,
        assignedTo: assignedUser ? { id: assignedUser.id, name: assignedUser.name } : null
      });
    }
    
    return complaints;
  },

  // Find historical complaints (all complaints including old resolved ones)
  async findHistory() {
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).orderBy('date', 'desc').get();
    const complaints = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const user = await User.findById(data.user_id);
      const assignedUser = data.assignedTo ? await User.findById(data.assignedTo) : null;

      complaints.push({
        id: doc.id,
        ...data,
        user_id: user ? { id: user.id, name: user.name, email: user.email } : null,
        assignedTo: assignedUser ? { id: assignedUser.id, name: assignedUser.name } : null
      });
    }
    
    return complaints;
  },

  // Find active complaints by user ID
  async findActiveByUserId(userId) {
    if (!userId) return [];
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).where('user_id', '==', userId).get();
    const complaints = [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip complaints resolved more than 24 hours ago
      if (data.status === 'Resolved' && data.resolvedAt) {
        const resolvedAt = data.resolvedAt.toDate ? data.resolvedAt.toDate() : new Date(data.resolvedAt);
        if (resolvedAt < twentyFourHoursAgo) {
          continue;
        }
      }
      
      complaints.push({ id: doc.id, ...data });
    }
    
    // Sort locally by date desc
    complaints.sort((a, b) => {
      const da = a.date ? a.date.toDate ? a.date.toDate() : new Date(a.date) : 0;
      const dbt = b.date ? b.date.toDate ? b.date.toDate() : new Date(b.date) : 0;
      return dbt - da;
    });
    return complaints;
  },

  // Find historical complaints by user ID
  async findHistoryByUserId(userId) {
    if (!userId) return [];
    const snapshot = await db.collection(COMPLAINTS_COLLECTION).where('user_id', '==', userId).get();
    const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort locally by date desc
    complaints.sort((a, b) => {
      const da = a.date ? a.date.toDate ? a.date.toDate() : new Date(a.date) : 0;
      const dbt = b.date ? b.date.toDate ? b.date.toDate() : new Date(b.date) : 0;
      return dbt - da;
    });
    return complaints;
  }
};

// ===================== TRANSACTION OPERATIONS =====================
const Transaction = {
  async create(transactionData) {
    const { user_id, room_id, amount, month } = transactionData;

    const transactionRef = await db.collection(TRANSACTIONS_COLLECTION).add({
      user_id,
      room_id,
      amount,
      status: 'Pending',
      month,
      date: new Date(),
      paidDate: null
    });

    return { id: transactionRef.id, ...transactionData };
  },

  async findAll() {
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).orderBy('date', 'desc').get();
    const transactions = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const user = await User.findById(data.user_id);
      const room = await Room.findById(data.room_id);

      transactions.push({
        id: doc.id,
        ...data,
        user_id: user ? { id: user.id, name: user.name, email: user.email } : null,
        room_id: room ? { id: room.id, room_number: room.room_number } : null
      });
    }
    
    return transactions;
  },

  async findById(id) {
    const doc = await db.collection(TRANSACTIONS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async findByUserId(userId) {
    if (!userId) return [];
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).where('user_id', '==', userId).get();
    const transactions = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const room = await Room.findById(data.room_id);
      transactions.push({
        id: doc.id,
        ...data,
        room_id: room ? { id: room.id, room_number: room.room_number } : null
      });
    }

    // Sort locally by date desc to avoid composite index requirements
    transactions.sort((a, b) => {
      const da = a.date ? a.date.toDate ? a.date.toDate() : new Date(a.date) : 0;
      const dbt = b.date ? b.date.toDate ? b.date.toDate() : new Date(b.date) : 0;
      return dbt - da;
    });

    return transactions;
  },

  async findPendingByUserId(userId) {
    if (!userId) return [];
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
      .where('user_id', '==', userId)
      .where('status', '==', 'Pending')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async update(id, updateData) {
    const updateObj = { ...updateData };
    if (updateData.status === 'Paid') {
      updateObj.paidDate = new Date();
    }
    const clean = Object.fromEntries(Object.entries(updateObj).filter(([, v]) => v !== undefined));
    await db.collection(TRANSACTIONS_COLLECTION).doc(id).update(clean);
    return this.findById(id);
  },

  async findByRoomId(roomId) {
    if (!roomId) return [];
    const snapshot = await db.collection(TRANSACTIONS_COLLECTION).where('room_id', '==', roomId).get();
    const transactions = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const user = await User.findById(data.user_id);
      transactions.push({
        id: doc.id,
        ...data,
        user_id: user ? { id: user.id, name: user.name, email: user.email } : null
      });
    }
    
    return transactions;
  }
};

// ===================== NOTICE OPERATIONS =====================
const Notice = {
  async create(noticeData) {
    const { title, content, createdBy } = noticeData;

    // Fix: Handle "Never" expiry (null) vs Default (24h)
    // If expires_at is specifically null, it's permanent.
    // If expires_at is undefined, default to 24h.
    let expiryDate = noticeData.expires_at === undefined 
      ? new Date(Date.now() + 24 * 60 * 60 * 1000) 
      : (noticeData.expires_at ? new Date(noticeData.expires_at) : null);

    const noticeRef = await db.collection(NOTICES_COLLECTION).add({
      title,
      content,
      date: new Date(),
      expires_at: expiryDate,
      priority: noticeData.priority || 'medium',
      createdBy
    });

    return { id: noticeRef.id, ...noticeData, expires_at: expiryDate };
  },

  async findAll(userId = null, isAdmin = false, activeOnly = false) {
    let query = db.collection(NOTICES_COLLECTION);
    
    const snapshot = await query.orderBy('date', 'desc').get();
    const notices = [];
    const now = new Date();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Filter out expired notices ONLY if activeOnly is true
      if (activeOnly && data.expires_at) {
        const expiry = data.expires_at.toDate ? data.expires_at.toDate() : new Date(data.expires_at);
        if (expiry < now) continue;
      }

      const creator = data.createdBy ? await User.findById(data.createdBy) : null;
      
      const notice = {
        id: doc.id,
        ...data,
        createdBy: creator ? { id: creator.id, name: creator.name } : null
      };

      // Add acknowledgment status if userId is provided (for students)
      if (userId) {
        const ackSnapshot = await db.collection(ACKNOWLEDGMENTS_COLLECTION)
          .where('notice_id', '==', doc.id)
          .where('user_id', '==', userId)
          .limit(1)
          .get();
        
        if (!ackSnapshot.empty) {
          const ackData = ackSnapshot.docs[0].data();
          notice.acknowledged = true;
          notice.acknowledged_at = ackData.acknowledged_at;
        } else {
          notice.acknowledged = false;
        }
      }

      // Add acknowledgment count if isAdmin (for admin dashboard)
      if (isAdmin) {
        const ackCountSnapshot = await db.collection(ACKNOWLEDGMENTS_COLLECTION)
          .where('notice_id', '==', doc.id)
          .get();
        notice.acknowledgeCount = ackCountSnapshot.size;
      }

      notices.push(notice);
    }
    
    return notices;
  },

  async findActive(userId = null, isAdmin = false) {
    return this.findAll(userId, isAdmin, true);
  },

  async findHistory(userId = null, isAdmin = false) {
    return this.findAll(userId, isAdmin, false);
  },

  async acknowledge(noticeId, userId) {
    if (!noticeId || !userId) throw new Error('Notice ID and User ID are required');
    
    // Check if already acknowledged
    const existing = await db.collection(ACKNOWLEDGMENTS_COLLECTION)
      .where('notice_id', '==', noticeId)
      .where('user_id', '==', userId)
      .get();
      
    if (!existing.empty) {
      return { message: 'Already acknowledged', id: existing.docs[0].id };
    }

    const ackRef = await db.collection(ACKNOWLEDGMENTS_COLLECTION).add({
      notice_id: noticeId,
      user_id: userId,
      acknowledged_at: new Date()
    });

    return { id: ackRef.id, message: 'Acknowledged successfully' };
  },

  async findById(id) {
    const doc = await db.collection(NOTICES_COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }
};

// ===================== ROOM CHANGE OPERATIONS =====================
const RoomChange = {
  async create(data) {
    const { user_id, current_room_id, requested_room_id, reason } = data;
    
    // Check if there's already a pending request for this user
    const pending = await db.collection(ROOM_CHANGES_COLLECTION)
      .where('user_id', '==', user_id)
      .where('status', '==', 'Pending')
      .get();
      
    if (!pending.empty) {
      throw new Error('You already have a pending room change request');
    }

    const requestRef = await db.collection(ROOM_CHANGES_COLLECTION).add({
      user_id,
      current_room_id,
      requested_room_id,
      reason,
      status: 'Pending',
      created_at: new Date()
    });

    return { id: requestRef.id, ...data, status: 'Pending' };
  },

  async findAll() {
    const snapshot = await db.collection(ROOM_CHANGES_COLLECTION).get();
    const requests = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const user = await User.findById(data.user_id);
      const currentRoom = await Room.findById(data.current_room_id);
      const requestedRoom = await Room.findById(data.requested_room_id);
      
      requests.push({
        id: doc.id,
        ...data,
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
        current_room: currentRoom,
        requested_room: requestedRoom
      });
    }
    
    // Sort by created_at desc in memory
    return requests.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
      return dateB - dateA;
    });
  },

  async findByUserId(userId) {
    const snapshot = await db.collection(ROOM_CHANGES_COLLECTION)
      .where('user_id', '==', userId)
      .get();
      
    const requests = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const currentRoom = await Room.findById(data.current_room_id);
      const requestedRoom = await Room.findById(data.requested_room_id);
      
      requests.push({
        id: doc.id,
        ...data,
        current_room: currentRoom,
        requested_room: requestedRoom
      });
    }
    
    // Sort by created_at desc in memory
    return requests.sort((a, b) => {
      const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
      const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
      return dateB - dateA;
    });
  },

  async update(id, updateData) {
    console.log(`[RoomChange.update] ID: ${id}, Update:`, updateData);
    const { status, admin_comment } = updateData;
    const requestDoc = await db.collection(ROOM_CHANGES_COLLECTION).doc(id).get();
    
    if (!requestDoc.exists) {
      console.error(`[RoomChange.update] Request not found: ${id}`);
      throw new Error('Request not found');
    }
    const requestData = requestDoc.data();
    console.log(`[RoomChange.update] Current Data:`, requestData);

    if (status === 'Approved' && requestData.status !== 'Approved') {
      console.log(`[RoomChange.update] Processing Approval...`);
      const { user_id, current_room_id, requested_room_id } = requestData;
      
      // Update User
      console.log(`[RoomChange.update] Updating User ${user_id} to room ${requested_room_id}`);
      await User.update(user_id, { room_id: requested_room_id });
      
      // Update Old Room Occupancy
      if (current_room_id) {
        const oldRoom = await Room.findById(current_room_id);
        if (oldRoom) {
          console.log(`[RoomChange.update] Decrementing occupancy for room ${current_room_id}`);
          await Room.update(current_room_id, { 
            occupancy: Math.max(0, (oldRoom.occupancy || 1) - 1) 
          });
        }
      }
      
      // Update New Room Occupancy
      const newRoom = await Room.findById(requested_room_id);
      if (newRoom) {
        console.log(`[RoomChange.update] Incrementing occupancy for room ${requested_room_id}`);
        await Room.update(requested_room_id, { 
          occupancy: (newRoom.occupancy || 0) + 1 
        });
      }
    }

    await db.collection(ROOM_CHANGES_COLLECTION).doc(id).update({
      status,
      admin_comment: admin_comment || '',
      updated_at: new Date()
    });
    console.log(`[RoomChange.update] Firestore update complete`);

    return { id, ...requestData, status };
  }
};

module.exports = {
  User,
  Room,
  Complaint,
  Transaction,
  Notice,
  RoomChange,
  db,
  USERS_COLLECTION,
  ROOMS_COLLECTION,
  COMPLAINTS_COLLECTION,
  TRANSACTIONS_COLLECTION,
  NOTICES_COLLECTION,
  ACKNOWLEDGMENTS_COLLECTION,
  ROOM_CHANGES_COLLECTION
};
