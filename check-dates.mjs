import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function run() {
  const bookingsSnap = await db.collection('bookings').get();
  console.log(`Total bookings: ${bookingsSnap.size}`);
  
  bookingsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, voyageScheduleId: ${data.voyageScheduleId}, Date: ${data.departureDate}`);
  });
}

run();
