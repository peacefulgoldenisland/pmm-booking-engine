import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { WaitlistEmail } from '@/components/emails/WaitlistEmail';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const { name, email, phone, dateOfDeparture, cabinClass, paxCount } = await request.json();

    if (!name || !email || !dateOfDeparture || !cabinClass) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Simpan ke Firestore
    const waitlistRef = db.collection('waitlists').doc();
    await waitlistRef.set({
      id: waitlistRef.id,
      name,
      email,
      phone: phone || '',
      dateOfDeparture,
      cabinClass,
      paxCount: paxCount || 1,
      status: 'WAITING', // Status bisa: WAITING, NOTIFIED, BOOKED
      createdAt: new Date().toISOString()
    });

    // 2. Kirim Email Konfirmasi via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'PMM Reserve <onboarding@resend.dev>', 
        to: email,
        subject: `[Waitlist] PMM Reserve - ${cabinClass}`,
        react: React.createElement(WaitlistEmail, {
          customerName: name,
          departureDate: dateOfDeparture,
          cabinClass: cabinClass,
          paxCount: paxCount || 1
        })
      });
    }

    return NextResponse.json({ success: true, message: 'Successfully joined waitlist' });

  } catch (error: any) {
    console.error('Waitlist Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}