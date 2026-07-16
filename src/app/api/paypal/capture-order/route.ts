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
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET;
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { paypalOrderId, pmmOrderId } = await request.json();

    if (!paypalOrderId || !pmmOrderId) {
      return NextResponse.json({ error: 'Missing Order IDs' }, { status: 400 });
    }

    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`;

    // 1. Eksekusi penarikan uang (Capture) di server PayPal
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      // 2. Jika sukses, update status tiket di Firestore jadi PAID
      const bookingRef = db.collection('bookings').doc(pmmOrderId);
      await bookingRef.update({
        status: 'PAID',
        paymentProofUrl: `paypal_txn_${data.id}`, // Simpan ID Transaksi PayPal sebagai bukti
        paidAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, transactionId: data.id });
    } else {
      throw new Error('PayPal capture did not complete successfully');
    }

  } catch (error: any) {
    console.error('🚨 PayPal Capture Error:', error);
    return NextResponse.json({ error: 'Capture failed', details: error.message }, { status: 500 });
  }
}