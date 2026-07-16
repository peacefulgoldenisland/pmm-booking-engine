import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Midtrans kita matikan/komen sementara agar performa API lebih cepat
// const midtransClient = require('midtrans-client'); 

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
    const body = await request.json();
    const { booking, contact, passengers } = body;

    if (!booking || !contact || !passengers || passengers.length === 0) {
      return NextResponse.json({ error: 'Incomplete booking data' }, { status: 400 });
    }

    if (!serviceAccount) {
        return NextResponse.json({ error: 'Server configuration error: Firebase Service Account missing' }, { status: 500 });
    }

    // 1. Cek atau Buat Shadow Account
    const usersRef = db.collection('users');
    const q = usersRef.where('email', '==', contact.email).limit(1);
    const querySnapshot = await q.get();

    let userId: string;
    let isNewUser = false;

    if (querySnapshot.empty) {
      const newUserRef = usersRef.doc(); 
      userId = newUserRef.id;
      isNewUser = true;

      await newUserRef.set({
        email: contact.email,
        phone: contact.phone,
        fullName: passengers[0]?.fullName || 'Guest',
        createdAt: new Date().toISOString(),
        role: 'guest',
        pointsBalance: 0
      });
    } else {
      userId = querySnapshot.docs[0].id;
    }

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
      paymentMethod: paymentMethod, // MANUAL_BANK, MANUAL_QRIS, atau PAYPAL
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

    // 5. Kembalikan Response ke Frontend
    // Kita lempar orderId dan paymentMethod agar halaman /payment tahu instruksi apa yang harus dimunculkan
    return NextResponse.json({ 
      success: true, 
      orderId: orderId,
      paymentMethod: paymentMethod,
      message: isNewUser ? 'Shadow Account and Booking created' : 'Booking created for existing user',
    });

  } catch (error: any) {
    console.error('Error in initiate checkout API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}