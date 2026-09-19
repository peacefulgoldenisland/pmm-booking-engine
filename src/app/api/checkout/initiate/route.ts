// src/app/api/checkout/initiate/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { v4 as uuidv4 } from 'uuid';

// Lazy init later inside POST

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    const userId = decodedToken.uid;

    const body = await request.json();
    const { booking, contact, passengers } = body;

    if (!booking || !contact || !passengers || passengers.length === 0) {
      return NextResponse.json({ error: 'Incomplete booking data' }, { status: 400 });
    }

    // Lazy Init Firebase Admin
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        return NextResponse.json({ error: 'Server configuration error: Firebase Service Account missing' }, { status: 500 });
    }

    if (!getApps().length) {
      try {
        const parsedKey = JSON.parse(serviceAccountKey);
        initializeApp({ credential: cert(parsedKey) });
      } catch (err) {
        console.error("Firebase Key Parse Error:", err);
        return NextResponse.json({ error: 'Server configuration error: Invalid Firebase Service Account JSON' }, { status: 500 });
      }
    }

    const db = getFirestore();

    // 1. Validasi Keberadaan User (Telah ditangani oleh Firebase Auth Token)

    // 2. Generate Order ID Unik (Misal: PMM-1704209123-ABCD)
    const orderId = `PMM-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;
    
    // 3. Validasi Metode Pembayaran (Blokir paksa jika ada yang iseng injek Midtrans dari console)
    const paymentMethod = booking.paymentMethod || 'DIRECT_TRANSFER';
    
    if (paymentMethod === 'MIDTRANS') {
        return NextResponse.json({ error: 'Midtrans is currently under maintenance.' }, { status: 400 });
    }

    // 4. Simpan Data Booking ke Firestore dengan Transaction (Concurrency Protection)
    const bookingsRef = db.collection('bookings');
    const voyageRef = db.collection('voyages').doc(booking.date);

    await db.runTransaction(async (transaction) => {
      const voyageDoc = await transaction.get(voyageRef);
      let cabinQuotas: Record<string, number> = {};

      if (!voyageDoc.exists) {
        // Auto-create voyage schedule for this date just like B2B admin!
        const productsSnap = await db.collection('products').get();
        productsSnap.forEach(doc => {
            const data = doc.data();
            if(data.totalUnits) cabinQuotas[doc.id] = data.totalUnits;
        });
        
        transaction.set(voyageRef, {
            departureDate: booking.date,
            status: 'SCHEDULED',
            cabinQuotas: cabinQuotas,
            createdAt: new Date().toISOString()
        });
      } else {
        const voyageData = voyageDoc.data() || {};
        cabinQuotas = voyageData.cabinQuotas || {};
      }
      
      const cart = booking.cart || {};
      
      // Validasi kuota
      for (const [cabinId, qty] of Object.entries(cart)) {
        const available = cabinQuotas[cabinId] || 0;
        if (available < (qty as number)) {
          throw new Error(`Insufficient quota for ${cabinId}. Available: ${available}`);
        }
      }
      
      // Kurangi kuota
      for (const [cabinId, qty] of Object.entries(cart)) {
        cabinQuotas[cabinId] -= (qty as number);
      }
      
      // Simpan perubahan kuota
      transaction.update(voyageRef, { cabinQuotas });

      // Simpan Booking
      const newBooking = {
        bookingId: orderId,
        userId: userId,
        status: 'PENDING',
        paymentMethod: paymentMethod, 
        totalAmount: booking.total,
        basePrice: booking.basePrice || booking.total,
        discountAmount: booking.discountAmount || 0,
        voucherId: booking.voucherId || null,
        currency: 'IDR', 
        dateOfDeparture: booking.date,
        voyageScheduleId: booking.voyageScheduleId || booking.date,
        cart: cart,
        cabinClass: booking.cabin,
        paxCount: booking.pax,
        pickupLocation: contact.pickupLocation,
        pickupArea: contact.pickupArea,
        passengersManifest: passengers,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        bookingSource: booking.bookingSource || "B2C_WEB",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newBookingRef = bookingsRef.doc(orderId);
      transaction.set(newBookingRef, newBooking);
    });

    return NextResponse.json({ 
      success: true, 
      orderId: orderId,
      paymentMethod: paymentMethod,
      message: 'Booking created successfully',
    });

  } catch (error: any) {
    console.error('Error in initiate checkout API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}