require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase
try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Missing Firebase credentials in environment variables');
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
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

const db = admin.firestore();

async function runMigration() {
  try {
    const snapshot = await db.collection('users').get();
    let index = 1;
    let updatedCount = 0;
    
    console.log('--- User Phone Numbers ---');
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      let phone = data.phone;
      if (!phone) {
        // Generate a 10-digit placeholder phone number
        phone = '999900000' + index;
        if (index > 9) phone = '99990000' + index; // lazy padding for up to 99 users
        
        await db.collection('users').doc(doc.id).update({ phone });
        updatedCount++;
        index++;
      }
      
      console.log(`Email: ${data.email.padEnd(30)} | Phone: ${phone}`);
    }
    
    console.log(`\nMigration complete. Updated ${updatedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
