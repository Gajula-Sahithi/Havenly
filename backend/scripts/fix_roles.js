require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase
try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
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
    })
  });
  console.log('Firebase initialized.');
} catch (error) {
  console.error('Firebase error:', error);
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  try {
    const snapshot = await db.collection('users').get();
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.role) {
        await db.collection('users').doc(doc.id).update({ role: 'student' });
        updatedCount++;
        console.log(`Updated user ${data.email} to have role 'student'.`);
      }
    }
    
    console.log(`\nFixed roles for ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

run();
