// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lazy Init Firebase Admin
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
    
    if (!getApps().length) {
      try {
        const parsedKey = JSON.parse(serviceAccountKey);
        initializeApp({ credential: cert(parsedKey) });
      } catch (err) {
        console.error("Firebase Key Parse Error:", err);
        return NextResponse.json({ error: 'Server configuration error: Invalid Firebase Service Account JSON' }, { status: 500 });
      }
    }

    const auth = getAuth();
    const db = getFirestore();

    // 1. Buat User di Firebase Auth
    const userRecord = await auth.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      displayName: fullName,
    });

    // 2. Tulis data User ke Firestore (Admin SDK kebal rules)
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      fullName: fullName,
      phone: phone || '',
      pointsBalance: 0,
      isGuest: false,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🚨 Register API Error:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email is already registered. Please login.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}