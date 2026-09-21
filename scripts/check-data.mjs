import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function checkData() {
  const bookingsSnap = await db.collection('bookings').get();
  const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`Total Bookings in DB: ${bookings.length}`);
  console.log("Bookings details:");
  bookings.forEach(b => {
      console.log(`ID: ${b.id}, Status: ${b.status}, CreatedAt: ${b.createdAt}, DepDate: ${b.departureDate}, Amt: ${b.totalAmount}, Guests: ${b.guests?.length || b.totalGuests}, Source: ${b.source || b.bookingSource}`);
  });

  const voyagesSnap = await db.collection('voyages').get();
  console.log("\nVoyages (Schedules):");
  voyagesSnap.docs.forEach(d => {
      console.log(`Date: ${d.id}, Quotas: ${JSON.stringify(d.data().cabinQuotas)}`);
  });
}

checkData().catch(console.error);
