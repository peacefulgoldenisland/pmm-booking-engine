"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Ship, Users, Loader2, 
  ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Logika Reschedule (menggunakan Date Object untuk DatePicker UI)
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Kunci (Locks)
  const [isLockedH3, setIsLockedH3] = useState(false);
  const [isLockedLimit, setIsLockedLimit] = useState(false);

  // 1. Ambil Data Booking
  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBooking({ id: docSnap.id, ...data });

          // Cek Aturan H-3
          const today = new Date();
          const departure = new Date(data.dateOfDeparture);
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

  // Handle Pemilihan Tanggal dari DatePicker
  const handleDateSelect = (date: Date) => {
    setSelectedDateObj(date);
    
    // Format YYYY-MM-DD aman timezone
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    setSelectedDateStr(localDate.toISOString().split('T')[0]);
  };

  // Filter Tanggal (Hanya Sabtu, H+3, dan bukan tanggal lama)
  const isDateValidForReschedule = (date: Date) => {
    // Syarat 1: Harus hari Sabtu (6)
    if (date.getDay() !== 6) return false;
    
    // Syarat 2: Harus minimal H+3 dari hari ini
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return false;

    // Syarat 3: Tidak boleh sama dengan jadwal lama
    if (booking && booking.dateOfDeparture) {
        const oldDate = new Date(booking.dateOfDeparture);
        if (date.getTime() === oldDate.getTime()) return false;
    }

    return true;
  };

  const getCabinCapacity = (cabinName: string) => {
    const name = cabinName.toLowerCase();
    if (name.includes("sea view")) return 8; 
    if (name.includes("standard")) return 4; 
    if (name.includes("down deck") && name.includes("2 pax")) return 16; 
    if (name.includes("down deck") && name.includes("1 pax")) return 2; 
    if (name.includes("sharing")) return 22; 
    return 8; 
  };

  // 3. Cek Ketersediaan Kuota Secara Real-time
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDateStr || !booking) return;
      
      setIsCheckingAvailability(true);
      setIsAvailable(null);

      try {
        const res = await fetch(`/api/availability?date=${selectedDateStr}`);
        
        if (res.ok) {
          const data = await res.json();
          const currentPaxCount = data.booked?.[booking.cabinClass] || 0;
          const maxCapacity = getCabinCapacity(booking.cabinClass);
          
          if (currentPaxCount + booking.paxCount <= maxCapacity) {
              setIsAvailable(true);
          } else {
              setIsAvailable(false);
          }
        } else {
          setIsAvailable(false);
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        setIsAvailable(false);
      } finally {
        setTimeout(() => setIsCheckingAvailability(false), 500); // Smooth skeleton
      }
    };

    checkAvailability();
  }, [selectedDateStr, booking]);

  // 4. Proses Reschedule
  const handleRescheduleSubmit = async () => {
    if (!booking || !selectedDateStr || !isAvailable) return;
    
    setIsSubmitting(true);
    try {
        const docRef = doc(db, 'bookings', booking.id);
        
        await updateDoc(docRef, {
            dateOfDeparture: selectedDateStr,
            rescheduleCount: (booking.rescheduleCount || 0) + 1,
            rescheduledAt: new Date().toISOString(),
            originalDateOfDeparture: booking.dateOfDeparture 
        });

        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);

    } catch (error) {
        console.error("Error updating reschedule:", error);
        alert("Transaction failed. Please contact concierge support.");
        setIsSubmitting(false);
    }
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

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
            <p className="text-gray-500 font-light text-sm leading-relaxed">As a valued guest, you are granted one complimentary schedule modification prior to 72 hours of departure, subject strictly to cabin availability.</p>
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
            <div className="bg-white p-8 md:p-10 shadow-luxury border border-gray-100 h-max relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-navy-900)]" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-gold-500)]" /> Current Manifest
                </h4>

                <div className="space-y-8">
                    <div>
                        <p className="text-xs text-gray-500 font-light mb-1">Scheduled Departure</p>
                        <p className="text-2xl font-serif text-[var(--color-navy-900)]">
                            {formatDateUI(booking.dateOfDeparture)}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 font-light mb-1.5">Accommodations</p>
                            <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2"><Ship className="w-4 h-4 text-gray-400"/> {booking.cabinClass}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-light mb-1.5">Party Size</p>
                            <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2"><Users className="w-4 h-4 text-gray-400"/> {booking.paxCount} Guests</p>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-light mb-1.5">Expedition Route</p>
                        <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--color-gold-500)]"/> Lombok to Komodo</p>
                    </div>
                </div>
            </div>

            {/* KOLOM 2: FORM PILIH JADWAL BARU */}
            <div className={`bg-[var(--color-surface-50)] p-8 md:p-10 shadow-sm border transition-colors duration-500 relative ${selectedDateStr ? 'border-[var(--color-gold-400)]' : 'border-gray-200'}`}>
                
                {/* Overlay transparan jika sedang dilock */}
                {(isLockedH3 || isLockedLimit) && (
                    <div className="absolute inset-0 bg-[var(--color-surface-50)]/60 backdrop-blur-sm z-20 flex items-center justify-center">
                      <LockIcon />
                    </div>
                )}

                <h4 className="text-[10px] font-bold text-[var(--color-gold-600)] uppercase tracking-widest mb-8">
                  Propose New Itinerary
                </h4>

                <div className="mb-8 relative z-10">
                    <DatePicker 
                        label="Select New Saturday Departure"
                        selectedDate={selectedDateObj}
                        onSelect={handleDateSelect}
                        filterDate={isDateValidForReschedule}
                    />
                </div>

                {/* STATUS KETERSEDIAAN */}
                <div className="min-h-[80px] mb-8 relative z-10">
                    <AnimatePresence mode="wait">
                        {isCheckingAvailability ? (
                            <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                                <div className="space-y-2 w-full">
                                  <Skeleton variant="text" className="w-1/2 h-3" />
                                  <Skeleton variant="text" className="w-3/4 h-2" />
                                </div>
                            </motion.div>
                        ) : selectedDateStr && isAvailable === true ? (
                            <motion.div key="available" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 bg-white p-5 rounded-sm border border-green-100 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-serif text-[var(--color-navy-900)] mb-1">Clearance Granted</p>
                                    <p className="text-[11px] font-light text-gray-500 leading-relaxed">Adequate capacity confirmed for {booking.paxCount} guests in {booking.cabinClass}.</p>
                                </div>
                            </motion.div>
                        ) : selectedDateStr && isAvailable === false ? (
                            <motion.div key="full" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 bg-white p-5 rounded-sm border border-red-100 shadow-sm">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-serif text-[var(--color-navy-900)] mb-1">Capacity Exceeded</p>
                                    <p className="text-[11px] font-light text-gray-500 leading-relaxed">The {booking.cabinClass} cannot accommodate {booking.paxCount} guests on this date. Please select an alternate weekend.</p>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* TOMBOL KONFIRMASI */}
                <Button 
                    onClick={handleRescheduleSubmit}
                    disabled={!selectedDateStr || isAvailable !== true || isSubmitting || isLockedH3 || isLockedLimit}
                    className="w-full !rounded-sm !py-4 uppercase tracking-widest text-xs relative z-10"
                >
                    {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Finalizing Manifest</>
                    ) : (
                        <>Confirm New Dates</>
                    )}
                </Button>
            </div>
        </div>
      </main>
    </div>
  );
}

function LockIcon() {
  return (
    <div className="flex flex-col items-center opacity-50">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
        <ShieldAlert className="w-5 h-5 text-gray-400" />
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Locked</span>
    </div>
  )
}