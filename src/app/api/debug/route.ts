import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;
if (!getApps().length && serviceAccount) { initializeApp({ credential: cert(serviceAccount) }); }
const db = getFirestore();

export async function GET(request: Request) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const bookingsSnap = await db.collection('bookings').where('createdAt', '>=', thirtyDaysAgoStr).get();
  const rawBookings = bookingsSnap.docs.map(d => d.data());

  let cutoffStr = '';
  let endStr = '';
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  lastSunday.setHours(0, 0, 0, 0);
  
  const nextSaturday = new Date(lastSunday);
  nextSaturday.setDate(lastSunday.getDate() + 6);
  nextSaturday.setHours(23, 59, 59, 999);

  cutoffStr = lastSunday.toISOString();
  endStr = nextSaturday.toISOString();
  
  const revenueMap: any = {};
  
  rawBookings.forEach(data => {
    if (!data.createdAt || data.createdAt < cutoffStr || data.createdAt > endStr) return;
    if (data.status === 'PAID') {
        const amt = data.totalAmount || 0;
        const d = new Date(data.createdAt);
        const sortKey = d.toISOString().split('T')[0];
        const display = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!revenueMap[sortKey]) revenueMap[sortKey] = { display, value: 0 };
        revenueMap[sortKey].value += amt;
    }
  });
  
  for (let i = 0; i < 7; i++) {
      const d = new Date(lastSunday);
      d.setDate(d.getDate() + i);
      const sortKey = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!revenueMap[sortKey]) {
        revenueMap[sortKey] = { display, value: 0 };
      }
    }

    const sortedDates = Object.keys(revenueMap).sort();
    const revenueTrend = sortedDates.map(key => ({
      label: revenueMap[key].display,
      value: revenueMap[key].value
    }));

  return NextResponse.json({ revenueTrend, cutoffStr, endStr });
}
