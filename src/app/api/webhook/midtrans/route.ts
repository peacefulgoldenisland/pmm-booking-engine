import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { Resend } from 'resend';
import { TicketEmail } from '@/components/emails/TicketEmail';
import * as React from 'react';

// Inisialisasi Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
  : null;

if (!getApps().length && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Ekstrak data dari notifikasi Midtrans
    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status, 
      fraud_status 
    } = body;

    // Keamanan: Validasi bahwa notifikasi benar-benar datang dari Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hashData = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto.createHash('sha512').update(hashData).digest('hex');

    if (expectedSignature !== signature_key) {
      console.error('🚨 Akses Ditolak: Invalid Midtrans Signature!');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Konversi status transaksi Midtrans ke status aplikasi kita
    let orderStatus = 'PENDING';
    
    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        orderStatus = 'PAID';
      }
    } else if (transaction_status === 'settlement') {
      orderStatus = 'PAID';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      orderStatus = 'FAILED';
    }

    // Proses update ke database jika statusnya berubah
    const bookingRef = db.collection('bookings').doc(order_id);
    const bookingSnap = await bookingRef.get();

    if (bookingSnap.exists) {
      const bookingData = bookingSnap.data();

      // CEGAH DOUBLE UPDATE: Hanya proses jika status sebelumnya bukan PAID
      if (bookingData?.status !== 'PAID' && orderStatus === 'PAID') {
        
        // 1. Kalkulasi Poin Loyalitas
        const pointsEarned = Math.floor(parseFloat(gross_amount) / 10);

        // 2. Update status Bookings
        await bookingRef.update({
          status: 'PAID',
          pointsEarned: pointsEarned,
          updatedAt: new Date().toISOString()
        });

        // 3. Suntik Poin ke Shadow Account tamu
        if (bookingData?.userId) {
          const userRef = db.collection('users').doc(bookingData.userId);
          await userRef.update({
            pointsBalance: FieldValue.increment(pointsEarned)
          });
        }

        console.log(`✅ Pesanan ${order_id} LUNAS. User mendapat ${pointsEarned} Poin.`);
        
        // 4. Memicu API Resend untuk mengirimkan HTML e-Ticket
        try {
          // Pengecekan API Key Ekstra
          if (!process.env.RESEND_API_KEY) {
            console.error("❌ CRITICAL: RESEND_API_KEY tidak ditemukan di environment Vercel!");
          } else {
            // Gunakan format destructuring { data, error } dari Resend SDK
            const { data, error } = await resend.emails.send({
              from: 'PGI Reserve <onboarding@resend.dev>', 
              to: bookingData?.contactEmail,
              subject: `[CONFIRMED] E-Ticket PGI Reserve - ${order_id}`,
              // Menggunakan React.createElement agar aman di dalam file .ts
              react: React.createElement(TicketEmail, {
                orderId: order_id,
                customerName: bookingData?.passengersManifest?.[0]?.fullName || 'Guest',
                departureDate: bookingData?.dateOfDeparture || '',
                cabinClass: bookingData?.cabinClass || '',
                paxCount: bookingData?.paxCount || 1,
                pickupLocation: bookingData?.pickupLocation || ''
              })
            });

            if (error) {
              console.error("❌ Resend API Error:", error);
            } else {
              console.log(`📧 Email e-Ticket berhasil dikirim! ID Pengiriman:`, data?.id);
            }
          }
        } catch (emailError) {
          console.error("❌ Server Error saat memproses Resend:", emailError);
        }

      } else if (orderStatus === 'FAILED') {
        await bookingRef.update({
          status: 'FAILED',
          updatedAt: new Date().toISOString()
        });
        console.log(`❌ Pesanan ${order_id} GAGAL/EXPIRED.`);
      }
    } else {
      console.error(`⚠️ Pesanan ${order_id} tidak ditemukan di database.`);
    }

    return NextResponse.json({ success: true, message: 'Webhook successfully processed' });

  } catch (error: any) {
    console.error('🚨 Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' }, 
      { status: 500 }
    );
  }
}