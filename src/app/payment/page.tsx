"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

import { PaymentSuccessState } from '@/components/payment/PaymentSuccessState';
import { PaymentInstructions } from '@/components/payment/PaymentInstructions';
import { InvoiceSummaryCard } from '@/components/payment/InvoiceSummaryCard';
import type { Booking } from '@/types/booking';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingData, setBookingData] = useState<Booking | null>(null);

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // 1. AUTH GUARD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login'); 
        return;
      }
      setTimeout(() => setIsAuthChecking(false), 500); 
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Fetch Booking Data (REAL-TIME LISTENER)
  useEffect(() => {
    if (isAuthChecking) return; 

    if (!orderId) {
      setErrorMessage("Transaction reference missing from URL.");
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, 'bookings', orderId);
    
    // onSnapshot membuat halaman bereaksi real-time jika Admin menekan Approve
    const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBookingData({ id: docSnap.id, ...docSnap.data() } as Booking);
      } else {
        setErrorMessage("Invoice documentation could not be retrieved from our secure vault.");
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching booking:", error);
      setErrorMessage("Secure connection interrupted. Please refresh the page.");
      setIsLoading(false);
    });

    return () => unsubscribeDoc();
  }, [orderId, isAuthChecking]);

  // 3. Countdown Timer (1x24 Hours)
  useEffect(() => {
    if (!bookingData || !bookingData.createdAt || bookingData.status !== 'PENDING') return;

    const createdAt = bookingData.createdAt;
    const createdAtMs = typeof createdAt === 'string' || typeof createdAt === 'number' 
      ? new Date(createdAt).getTime()
      : (createdAt as any)?.toDate?.()?.getTime() || new Date().getTime();
      
    const expiryTime = createdAtMs + (24 * 60 * 60 * 1000);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('EXPIRED');
        clearInterval(interval);
      } else {
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingData]);

  if (isAuthChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] font-sans">
        <header className="bg-white border-b border-gray-200 py-5 px-6"><Skeleton className="w-48 h-6" /></header>
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
          <Skeleton className="w-full h-32 rounded-sm mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             <div className="lg:col-span-7"><Skeleton className="w-full h-[500px] rounded-sm" /></div>
             <div className="lg:col-span-5"><Skeleton className="w-full h-[400px] rounded-sm" /></div>
          </div>
        </main>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-sm border border-gray-200 shadow-luxury text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Invoice Unavailable</h2>
          <p className="text-gray-500 text-xs font-light leading-relaxed mb-8">{errorMessage}</p>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full !rounded-sm !py-3 uppercase tracking-widest text-xs">
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (!bookingData) return null;

  const { status, paymentMethod, totalAmount } = bookingData;

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col font-sans pb-24">
      
      {/* FULL WIDTH EDITORIAL HEADER */}
      <header className="bg-white border-b border-gray-200 pt-6 pb-5 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button onClick={() => router.back()} className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Modification Portal
          </button>
          
          <div className="flex items-center gap-3 md:gap-6 self-center">
            <div className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <div className="w-5 h-5 rounded-full bg-[var(--color-navy-900)] text-white flex items-center justify-center font-bold text-[10px]">1</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Manifest</span>
            </div>
            <div className="w-8 md:w-16 h-px bg-[var(--color-navy-900)]" />
            <div className="flex items-center gap-2 text-[var(--color-gold-600)]">
              <div className="w-5 h-5 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center font-bold text-[10px]">2</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Remittance</span>
            </div>
            <div className="w-8 md:w-16 h-px bg-gray-300" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center font-bold text-[10px]">3</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Clearance</span>
            </div>
          </div>
          <div className="hidden md:block w-40" />
        </div>
      </header>

      {/* OPTIMIZED WIDE CONTAINER MAX-W-7XL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 mt-10 md:mt-12">
        
        {/* SCENARIO 1: ALREADY PAID OR WAITING FOR VERIFICATION */}
        {(status === 'WAITING_VERIFICATION' || status === 'PAID') && (
          <PaymentSuccessState status={status} />
        )}

        {/* SCENARIO 2: PENDING PAYMENT */}
        {status === 'PENDING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN (7 Grids): INSTRUCTIONS & UPLOAD */}
            <PaymentInstructions 
              bookingData={bookingData} 
              timeLeft={timeLeft} 
              isExpired={isExpired} 
              setErrorMessage={setErrorMessage} 
            />

            {/* RIGHT COLUMN (5 Grids): PAYMENT SUMMARY WIDGET */}
            <InvoiceSummaryCard 
              orderId={orderId as string} 
              totalAmount={totalAmount} 
              paymentMethod={paymentMethod} 
            />

          </div>
        )}

      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-serif text-2xl text-[var(--color-navy-900)]"><Loader2 className="w-10 h-10 animate-spin text-[var(--color-gold-500)] mb-4"/> Establishing Secure Gateway...</div>}>
      <PaymentContent />
    </Suspense>
  );
}