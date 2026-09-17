// src/app/api/checkout/initiate/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { v4 as uuidv4 } from 'uuid';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

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

    if (!serviceAccount) {
        return NextResponse.json({ error: 'Server configuration error: Firebase Service Account missing' }, { status: 500 });
    }

    // 1. Validasi Keberadaan User (Telah ditangani oleh Firebase Auth Token)

    // 2. Generate Order ID Unik (Misal: PMM-1704209123-ABCD)
    const orderId = `PMM-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;
    
    // 3. Validasi Metode Pembayaran (Blokir paksa jika ada yang iseng injek Midtrans dari console)
    const paymentMethod = booking.paymentMethod || 'MANUAL_BANK';
    
    if (paymentMethod === 'MIDTRANS') {
        return NextResponse.json({ error: 'Midtrans is currently under maintenance.' }, { status: 400 });
    }

    // 4. Simpan Data Booking ke Firestore (Tanpa Midtrans Snap Token)
    const bookingsRef = db.collection('bookings');
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

    await bookingsRef.doc(orderId).set(newBooking);

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