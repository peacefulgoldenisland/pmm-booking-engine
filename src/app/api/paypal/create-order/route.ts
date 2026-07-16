import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Konfigurasi Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// 2. Kredensial PayPal & Exchange Rate
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;

// Otomatis pakai Sandbox jika di localhost, dan Live jika di-deploy ke produksi
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// 3. Helper: Fungsi Penghasil Token PayPal
async function generateAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  
  const data = await response.json();
  return data.access_token;
}

// 4. Helper: Penarik Kurs Dinamis dengan Mekanisme Fallback
async function getDynamicExchangeRate() {
  // Angka ini akan dipakai JIKA server ExchangeRate-API mati/error
  const FALLBACK_RATE = 16200; 

  if (!EXCHANGERATE_API_KEY) {
    console.warn("⚠️ EXCHANGERATE_API_KEY tidak ditemukan. Menggunakan kurs statis.");
    return FALLBACK_RATE;
  }

  try {
    // Cache hasil fetch selama 3600 detik (1 jam) agar tidak menghabiskan kuota gratisan 1.500 req/bulan
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`, {
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'success' && data.conversion_rates?.IDR) {
      const realRate = data.conversion_rates.IDR;
      console.log(`💱 Live Exchange Rate Fetched: 1 USD = Rp ${realRate}`);
      return realRate;
    } else {
      throw new Error('Struktur response ExchangeRate tidak valid');
    }
  } catch (error) {
    console.error('🚨 Error fetching live exchange rate:', error);
    console.log(`🔄 Mengaktifkan Mekanisme Fallback: Menggunakan Rp ${FALLBACK_RATE}`);
    return FALLBACK_RATE;
  }
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 5. Ambil data tagihan murni dari Firestore (Bukan dari Frontend)
    const bookingRef = db.collection('bookings').doc(orderId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking invoice not found' }, { status: 404 });
    }

    const bookingData = bookingSnap.data();

    // Proteksi: Pastikan tiket ini masih PENDING
    if (bookingData?.status !== 'PENDING') {
       return NextResponse.json({ error: 'This booking is already paid or cancelled' }, { status: 400 });
    }

    // 6. Konversi IDR ke USD Secara Dinamis
    const currentExchangeRate = await getDynamicExchangeRate();
    const idrAmount = bookingData?.totalAmount || 0;
    const usdAmount = (idrAmount / currentExchangeRate).toFixed(2); // Dibulatkan 2 angka di belakang koma

    console.log(`💵 Menagih PayPal: Rp ${idrAmount} dibagi ${currentExchangeRate} = $${usdAmount}`);

    // 7. Buat Tagihan di Server PayPal
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders`;

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: 'USD',
            value: usdAmount,
          },
          description: `PMM Voyage - ${bookingData?.cabinClass} (${bookingData?.paxCount} Pax)`,
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create PayPal order');
    }

    // 8. Kembalikan PayPal Order ID ke Frontend untuk memunculkan Pop-up
    return NextResponse.json({ id: data.id }, { status: 200 });

  } catch (error: any) {
    console.error('🚨 PayPal Create Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}