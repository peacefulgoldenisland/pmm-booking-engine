"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';

import { TicketLockedState } from '@/components/ticket/TicketLockedState';
import { TicketBoardingPass } from '@/components/ticket/TicketBoardingPass';
import type { Booking } from '@/types/booking';

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // REAL-TIME LISTENER
  useEffect(() => {
    if (!id) return;
    
    const docRef = doc(db, 'bookings', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setBooking({ id: docSnap.id, ...docSnap.data() } as Booking);
      } else {
        router.push('/dashboard');
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching ticket:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)] mb-4" />
        <p className="text-[var(--color-navy-900)] font-serif text-xl animate-pulse">Generating Boarding Pass...</p>
      </div>
    );
  }

  if (!booking) return null;

  // =========================================================
  // GATEKEEPER: KUNCI TIKET JIKA BELUM LUNAS
  // =========================================================
  if (booking.status !== 'PAID') {
    return <TicketLockedState booking={booking} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] py-8 font-sans print:bg-white print:py-0">
      
      {/* Navigation & Actions (Sembunyi saat dicetak) */}
      <div className="max-w-[850px] mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center px-4 gap-4 print:hidden">
        <button 
          onClick={() => router.back()} 
          className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Member Dashboard
        </button>
        <Button 
          onClick={handlePrint}
          className="!rounded-sm !py-3 !px-6 uppercase tracking-widest text-xs flex items-center gap-2 shadow-luxury"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <TicketBoardingPass booking={booking} />

      {/* STYLING KHUSUS UNTUK PRINT */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 1.5cm; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important; 
          }
        }
      `}} />
    </div>
  );
}