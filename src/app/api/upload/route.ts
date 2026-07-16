import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Konfigurasi Firebase Admin (Untuk By-pass Firestore Rules)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string | null; // Parameter baru

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dikirimkan' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Jika ada orderId, masukkan ke folder payment_proofs. Jika tidak, ke profiles.
    const folderName = orderId ? 'pmm_payment_proofs' : 'pmm_reserve_profiles';

    // 3. Proses Unggah ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: folderName,
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET 
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const secureUrl = (uploadResult as any).secure_url;

    // 4. JIKA ADA ORDER ID: Update Status di Firestore secara aman via Backend
    if (orderId && serviceAccount) {
      const bookingRef = db.collection('bookings').doc(orderId);
      await bookingRef.update({
          status: 'WAITING_VERIFICATION',
          paymentProofUrl: secureUrl,
          uploadedAt: new Date().toISOString()
      });
    }

    // 5. Kembalikan URL sukses ke Frontend
    return NextResponse.json({ url: secureUrl, success: true }, { status: 200 });

  } catch (error: any) {
    console.error('🚨 Backend Upload & Update Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses file' }, { status: 500 });
  }
}