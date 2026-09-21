import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    // 1. Get all products (cabins)
    const productsSnap = await db.collection('products').get();
    const products = productsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    // 2. Query bookings for this date to get REAL booked units
    const bookingsSnap = await db.collection('bookings')
      .where('dateOfDeparture', '==', date)
      .where('status', 'in', ['WAITING_VERIFICATION', 'PAID', 'PENDING'])
      .get();

    const bookedUnits: Record<string, number> = {};
    bookingsSnap.forEach(doc => {
      const b = doc.data();
      
      if (b.cart && typeof b.cart === 'object') {
        // Web bookings have a cart with cabinId -> qty
        for (const [cId, qty] of Object.entries(b.cart)) {
          bookedUnits[cId] = (bookedUnits[cId] || 0) + (qty as number);
        }
      } else {
        // Admin bookings or old bookings might just have cabinClass (name) and paxCount
        const cabinName = b.cabinClass;
        const qty = b.paxCount || b.totalGuests || (b.guests ? b.guests.length : 1);
        if (cabinName) {
           const product = products.find(p => p.name === cabinName);
           if (product) {
              bookedUnits[product.id] = (bookedUnits[product.id] || 0) + qty;
           }
        } else if (b.cabinId) {
           bookedUnits[b.cabinId] = (bookedUnits[b.cabinId] || 0) + qty;
        }
      }
    });

    // 3. Compute real availability
    const realAvailability: Record<string, number> = {};
    const bookedByName: Record<string, number> = {}; // For backward compatibility with RescheduleForm
    
    products.forEach(p => {
       const total = p.totalUnits || 0;
       const booked = bookedUnits[p.id] || 0;
       realAvailability[p.id] = Math.max(0, total - booked);
       bookedByName[p.name] = booked; 
    });

    // 4. Auto-heal the voyage document
    const scheduleRef = db.collection('voyages').doc(date);
    const scheduleDoc = await scheduleRef.get();
    
    if (scheduleDoc.exists) {
      const currentQuotas = scheduleDoc.data()?.cabinQuotas || {};
      let outOfSync = false;
      for (const [key, val] of Object.entries(realAvailability)) {
         if (currentQuotas[key] !== val) outOfSync = true;
      }
      if (outOfSync) {
         await scheduleRef.update({ cabinQuotas: realAvailability });
      }
    } else {
      await scheduleRef.set({ departureDate: date, cabinQuotas: realAvailability });
    }

    return NextResponse.json({ 
      booked: bookedByName,
      availableSeats: realAvailability
    });
  } catch (error) {
    console.error("Availability API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}