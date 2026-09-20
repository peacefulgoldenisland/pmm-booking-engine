import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, allowedMenus } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone ? (phone.startsWith('+') ? phone : `+62${phone.replace(/^0+/, '')}`) : undefined,
    });

    // 2. Create user document in Firestore
    const userData = {
      email: userRecord.email,
      fullName: userRecord.displayName,
      role: role || 'admin',
      allowedMenus: allowedMenus || [],
      phone: userRecord.phoneNumber || '',
      isSuspended: false,
      createdAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json({ 
      success: true, 
      uid: userRecord.uid,
      data: userData
    });

  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create staff' },
      { status: 500 }
    );
  }
}
