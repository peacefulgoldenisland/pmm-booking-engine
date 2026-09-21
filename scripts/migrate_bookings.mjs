import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function migrateData() {
  console.log("Fetching products to map names to IDs...");
  const productsSnap = await db.collection('products').get();
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log("Fetching bookings that need migration...");
  const bookingsSnap = await db.collection('bookings').get();
  
  let migratedCount = 0;
  
  for (const doc of bookingsSnap.docs) {
    const data = doc.data();
    
    // Check if it's an old admin booking (missing cart, has cabinClass and paxCount)
    if (!data.cart && data.cabinClass) {
        console.log(`Migrating booking ${doc.id}...`);
        const product = products.find(p => p.name === data.cabinClass);
        
        if (product) {
            const qty = data.paxCount || data.totalGuests || (data.guests ? data.guests.length : 1);
            
            const updates = {
                cart: { [product.id]: qty },
                bookingSource: data.source || 'OFFICE',
                voyageScheduleId: data.voyageScheduleId || data.dateOfDeparture
            };
            
            await db.collection('bookings').doc(doc.id).update(updates);
            console.log(` -> Added cart: ${JSON.stringify(updates.cart)}`);
            migratedCount++;
        } else {
            console.log(` -> Failed! Could not find product with name: ${data.cabinClass}`);
        }
    }
  }
  
  console.log(`Migration complete! Successfully migrated ${migratedCount} bookings.`);
}

migrateData().catch(console.error);
