// src/app/api/availability/route.ts
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

    const bookingsRef = db.collection('bookings');
    // Cari tiket yang sudah dibayar atau sedang proses bayar
    const snapshot = await bookingsRef
      .where('dateOfDeparture', '==', date)
      .where('status', 'in', ['PAID', 'PENDING'])
      .get();

    const booked: Record<string, number> = {};
    
    // Hitung total pax per tipe kabin
    snapshot.forEach(doc => {
      const data = doc.data();
      booked[data.cabinClass] = (booked[data.cabinClass] || 0) + (data.paxCount || 0);
    });

    return NextResponse.json({ booked });
  } catch (error) {
    console.error("Availability API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}