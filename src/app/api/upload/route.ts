// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid'; // Menggunakan uuid yang sudah ada di project

// 1. Konfigurasi Cloudflare R2 (S3 Compatible)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
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
    const orderId = formData.get('orderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dikirimkan' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Penentuan folder
    const folderName = orderId ? 'pmm_payment_proofs' : 'pmm_reserve_profiles';
    
    // Ekstraksi ekstensi file dan pembuatan nama unik
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${folderName}/${Date.now()}-${uuidv4()}.${fileExtension}`;

    // 3. Proses Unggah ke Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    // Konstruksi URL Publik dari Cloudflare
    const secureUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${uniqueFileName}`;

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