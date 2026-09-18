"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, ArrowLeft, ShieldAlert } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore'; 
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CurrentManifestCard } from '@/components/dashboard/CurrentManifestCard';
import { RescheduleForm } from '@/components/dashboard/RescheduleForm';
import type { Booking } from '@/types/booking';

export default function ReschedulePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const id = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Kunci (Locks)
  const [isLockedH3, setIsLockedH3] = useState(false);
  const [isLockedLimit, setIsLockedLimit] = useState(false);

  // Ambil Data Booking
  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBooking({ id: docSnap.id, ...data } as Booking);

          // Cek Aturan H-3
          const today = new Date();
          const departureDateVal = data.dateOfDeparture;
          const departure = typeof departureDateVal === 'string' || typeof departureDateVal === 'number'
            ? new Date(departureDateVal)
            : departureDateVal.toDate?.() || new Date();
          const diffTime = departure.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3) setIsLockedH3(true);

          // Cek Aturan 1x Limit
          if (data.rescheduleCount && data.rescheduleCount >= 1) {
            setIsLockedLimit(true);
          }

        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col font-sans">
        <header className="bg-[var(--color-navy-900)] py-6 px-6 md:px-10 shadow-luxury">
          <Skeleton variant="text" className="w-32 h-4 bg-white/10" />
        </header>
        <main className="max-w-5xl mx-auto px-6 mt-16 w-full flex gap-8">
            <Skeleton className="w-1/2 h-[400px]" />
            <Skeleton className="w-1/2 h-[400px]" />
        </main>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24">
      
      {/* HEADER MINIMALIS & EDITORIAL */}
      <header className="bg-white py-6 px-6 md:px-10 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button 
                onClick={() => router.back()} 
                className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" /> Return to Vault
            </button>
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-[var(--color-gold-500)]" />
              <span className="text-[var(--color-navy-900)] font-bold tracking-widest uppercase text-xs">Modification Portal</span>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-12 md:mt-16">
        
        <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-serif text-[var(--color-navy-900)] mb-3">Amend Voyage Dates</h2>
            <p className="text-gray-500 font-light text-sm leading-relaxed">
              As a valued guest, you are granted one complimentary schedule modification prior to 72 hours of departure, subject strictly to cabin availability.
            </p>
        </div>

        {/* PESAN ERROR (ATURAN KUNCI) */}
        <AnimatePresence>
            {(isLockedH3 || isLockedLimit) && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-l-4 border-red-500 p-6 md:p-8 rounded-sm shadow-sm mb-10 flex items-start gap-5 max-w-3xl mx-auto"
                >
                    <div className="bg-red-50 p-3 rounded-full shrink-0">
                      <ShieldAlert className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif text-[var(--color-navy-900)] mb-2">Modification Locked</h3>
                        {isLockedLimit ? (
                            <p className="text-sm text-gray-600 font-light leading-relaxed">This reservation has been previously amended. Our maritime protocol permits a maximum of one (1) complimentary modification per itinerary.</p>
                        ) : isLockedH3 ? (
                            <p className="text-sm text-gray-600 font-light leading-relaxed">Date modifications are strictly prohibited within 72 hours of departure to accommodate complex maritime logistics and provision procurements.</p>
                        ) : null}
                        <Button variant="outline" onClick={() => router.back()} className="mt-5 !py-2 !px-6 !text-xs !rounded-sm">
                            Acknowledge & Return
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* KOLOM 1: JADWAL SAAT INI */}
            <CurrentManifestCard booking={booking} />

            {/* KOLOM 2: FORM PILIH JADWAL BARU */}
            <RescheduleForm 
              booking={booking} 
              isLockedH3={isLockedH3} 
              isLockedLimit={isLockedLimit} 
            />

        </div>
      </main>
    </div>
  );
}