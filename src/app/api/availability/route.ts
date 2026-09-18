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

    const scheduleDoc = await db.collection('voyages').doc(date).get();

    // Jika schedule belum digenerate admin (tidak ada), tolak request
    // RescheduleForm akan menganggap ini isAvailable = false
    if (!scheduleDoc.exists) {
      return NextResponse.json({ error: 'Voyage schedule not found for this date' }, { status: 404 });
    }

    const scheduleData = scheduleDoc.data();
    const quotas = scheduleData?.cabinQuotas || {};
    const booked: Record<string, number> = {};
    
    const productsSnap = await db.collection('products').get();
    
    // Hitung mundur (Booked = Max - Available) agar RescheduleForm tetap berjalan tanpa perlu diubah
    productsSnap.forEach(doc => {
      const data = doc.data();
      const cabinId = doc.id;
      const cabinName = data.name;
      const maxCapacity = data.maxCapacity || 0;
      
      const available = quotas[cabinId] !== undefined ? quotas[cabinId] : 0;
      
      booked[cabinName] = Math.max(0, maxCapacity - available);
    });

    return NextResponse.json({ booked });
  } catch (error) {
    console.error("Availability API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}