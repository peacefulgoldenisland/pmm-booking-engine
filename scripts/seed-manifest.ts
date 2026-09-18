import { loadEnvConfig } from '@next/env';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Load Environment Variables
loadEnvConfig(process.cwd());

// 2. Initialize Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
  process.exit(1);
}
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  console.log("Cleaning up all historical data (userId == HISTORICAL_DATA)...");
  const oldDocs = await db.collection('bookings').where('userId', '==', 'HISTORICAL_DATA').get();
  
  if (oldDocs.empty) {
    console.log("No historical data found.");
    return;
  }

  const deleteBatch = db.batch();
  oldDocs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  
  await deleteBatch.commit();
  console.log(`Successfully deleted ${oldDocs.size} old historical bookings.`);
}

run().catch(console.error);
