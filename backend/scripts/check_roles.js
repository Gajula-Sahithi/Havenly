const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function checkUsers() {
  const snapshot = await db.collection('users').get();
  console.log('--- USER ROLES ---');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Name: ${data.name}, Email: ${data.email}, Role: ${data.role}`);
  });
  process.exit(0);
}

checkUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
