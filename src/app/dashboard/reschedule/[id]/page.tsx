"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Ship, Users, Loader2, 
  ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Logika Reschedule
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
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

          // Cek Aturan H-3 (Tidak bisa reschedule jika sisa waktu <= 3 hari)
          const today = new Date();
          const departure = new Date(data.dateOfDeparture);
          const diffTime = departure.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3) setIsLockedH3(true);

          // Cek Aturan 1x Limit (Hanya boleh 1x reschedule)
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

  // 2. Generate Jadwal Baru (Sabtu, 52 Minggu ke depan)
  useEffect(() => {
    const getNextSaturdays = () => {
      const dates = [];
      let d = new Date();
      const currentDay = d.getDay();
      
      if (currentDay === 5 || currentDay === 6) {
         d.setDate(d.getDate() + (6 - currentDay + 7)); 
      } else {
         d.setDate(d.getDate() + (6 - currentDay));
      }

      for (let i = 0; i < 52; i++) {
        const nextSat = new Date(d);
        nextSat.setDate(d.getDate() + (i * 7));
        const dateString = nextSat.toISOString().split('T')[0];
        
        // Jangan masukkan tanggal yang sama dengan jadwal saat ini
        if (booking && dateString !== booking.dateOfDeparture) {
            dates.push(dateString);
        }
      }
      return dates;
    };

    if (booking && !isLockedH3 && !isLockedLimit) {
        const dates = getNextSaturdays();
        setAvailableDates(dates);
        // Default kosong agar tamu memilih dulu
        setSelectedDate(""); 
    }
  }, [booking, isLockedH3, isLockedLimit]);

  // Kapasitas Maksimal per Kabin (Sama seperti di Homepage)
  const getCabinCapacity = (cabinName: string) => {
    const name = cabinName.toLowerCase();
    if (name.includes("sea view")) return 8; 
    if (name.includes("standard")) return 4; 
    if (name.includes("down deck") && name.includes("2 pax")) return 16; 
    if (name.includes("down deck") && name.includes("1 pax")) return 2; 
    if (name.includes("sharing")) return 22; 
    return 8; // Default fallback
  };

  // 3. Cek Ketersediaan Kuota Secara Real-time
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDate || !booking) return;
      
      setIsCheckingAvailability(true);
      setIsAvailable(null);

      try {
        const bookingsRef = collection(db, 'bookings');
        // Cari semua tiket di tanggal baru dengan tipe kabin yang sama dan status PAID
        const q = query(
            bookingsRef, 
            where('dateOfDeparture', '==', selectedDate),
            where('cabinClass', '==', booking.cabinClass),
            where('status', '==', 'PAID')
        );
        
        const querySnapshot = await getDocs(q);
        
        let currentPaxCount = 0;
        querySnapshot.forEach((doc) => {
            currentPaxCount += doc.data().paxCount || 0;
        });

        const maxCapacity = getCabinCapacity(booking.cabinClass);
        
        // Cek apakah kuota yang ada ditambah jumlah tamu kita masih muat
        if (currentPaxCount + booking.paxCount <= maxCapacity) {
            setIsAvailable(true);
        } else {
            setIsAvailable(false);
        }

      } catch (error) {
        console.error("Error checking availability:", error);
        setIsAvailable(false);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [selectedDate, booking]);

  // 4. Proses Reschedule
  const handleRescheduleSubmit = async () => {
    if (!booking || !selectedDate || !isAvailable) return;
    
    setIsSubmitting(true);
    try {
        const docRef = doc(db, 'bookings', booking.id);
        
        await updateDoc(docRef, {
            dateOfDeparture: selectedDate,
            rescheduleCount: (booking.rescheduleCount || 0) + 1,
            rescheduledAt: new Date().toISOString(),
            originalDateOfDeparture: booking.dateOfDeparture // Simpan jejak tanggal asli
        });

        // Simulasi loading agar UI terasa sedang memproses data berat
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);

    } catch (error) {
        console.error("Error updating reschedule:", error);
        alert("Failed to reschedule. Please try again or contact support.");
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
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <h2 className="text-lg font-bold text-navy animate-pulse">Accessing Itinerary...</h2>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-24 selection:bg-gold selection:text-navy">
      
      {/* HEADER MINIMALIS */}
      <header className="bg-navy py-6 px-4 md:px-8 shadow-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
                onClick={() => router.back()} 
                className="text-gray-400 hover:text-white text-sm font-bold transition-colors flex items-center gap-2"
            >
                &larr; Back to Vault
            </button>
            <h1 className="text-white font-extrabold tracking-widest uppercase text-sm">Reschedule Portal</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-10">
        
        <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-navy">Modify Voyage</h2>
            <p className="text-gray-500 mt-2">You are allowed to reschedule your voyage once (1x) free of charge, subject to cabin availability.</p>
        </div>

        {/* PESAN ERROR (ATURAN KUNCI) */}
        <AnimatePresence>
            {(isLockedH3 || isLockedLimit) && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl mb-8 flex items-start gap-4"
                >
                    <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
                    <div>
                        <h3 className="text-lg font-extrabold text-red-700 mb-1">Modification Locked</h3>
                        {/* PERBAIKAN: Menambahkan ': null' di akhir ternary bersarang */}
                        {isLockedLimit ? (
                            <p className="text-sm text-red-600 font-medium">This booking has already been rescheduled once. Our policy allows a maximum of one (1) free modification per booking.</p>
                        ) : isLockedH3 ? (
                            <p className="text-sm text-red-600 font-medium">Rescheduling is strictly prohibited within 72 hours (3 Days) of departure due to maritime logistics and provisions lock-in.</p>
                        ) : null}
                        <button onClick={() => router.back()} className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-colors">
                            Return to Dashboard
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* KOLOM 1: JADWAL SAAT INI */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-max">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-6">
                    Current Itinerary
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Departure Date</p>
                        <p className="text-xl font-extrabold text-navy flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gold" /> {formatDateUI(booking.dateOfDeparture)}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cabin Class</p>
                            <p className="text-sm font-extrabold text-navy flex items-center gap-1.5"><Ship className="w-4 h-4 text-gold"/> {booking.cabinClass}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Guests</p>
                            <p className="text-sm font-extrabold text-navy flex items-center gap-1.5"><Users className="w-4 h-4 text-gold"/> {booking.paxCount} Pax</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Route</p>
                        <p className="text-sm font-extrabold text-navy flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gold"/> Lombok ➔ Komodo</p>
                    </div>
                </div>
            </div>

            {/* KOLOM 2: FORM PILIH JADWAL BARU */}
            <div className={`bg-white rounded-3xl p-8 shadow-2xl border transition-colors ${selectedDate ? 'border-gold' : 'border-gray-100'} relative overflow-hidden`}>
                {/* Overlay transparan jika sedang dilock */}
                {(isLockedH3 || isLockedLimit) && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10" />
                )}

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gold/10 text-gold font-extrabold text-[10px] uppercase tracking-widest mb-6">
                    New Itinerary
                </div>

                <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select New Departure Date</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Calendar className="w-5 h-5 text-navy" />
                      </div>
                      <select 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        disabled={isLockedH3 || isLockedLimit || isSubmitting}
                        className="w-full bg-gray-50 hover:bg-white border-2 border-gray-200 focus:border-gold text-navy font-extrabold text-sm px-4 py-4 pl-12 rounded-2xl focus:outline-none appearance-none transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="" disabled>Select available date...</option>
                        {availableDates.map(date => (
                          <option key={date} value={date}>{formatDateUI(date)}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                         <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                </div>

                {/* STATUS KETERSEDIAAN */}
                <div className="min-h-[80px] mb-8">
                    {isCheckingAvailability ? (
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <Loader2 className="w-5 h-5 animate-spin text-gold" />
                            <p className="text-xs font-bold text-navy">Checking cabin quota with Harbor Master...</p>
                        </div>
                    ) : selectedDate && isAvailable === true ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-start gap-3 bg-green-50 p-4 rounded-xl border border-green-200">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-extrabold text-green-700">Cabins Available!</p>
                                <p className="text-[10px] font-medium text-green-600 mt-1">There are enough seats for your group ({booking.paxCount} Pax) in the {booking.cabinClass} on this date.</p>
                            </div>
                        </motion.div>
                    ) : selectedDate && isAvailable === false ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-200">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-extrabold text-red-700">Not Enough Space</p>
                                <p className="text-[10px] font-medium text-red-600 mt-1">The {booking.cabinClass} is fully booked or does not have enough capacity for {booking.paxCount} guests on this date. Please select another date.</p>
                            </div>
                        </motion.div>
                    ) : null}
                </div>

                {/* TOMBOL KONFIRMASI */}
                <button 
                    onClick={handleRescheduleSubmit}
                    disabled={!selectedDate || isAvailable !== true || isSubmitting || isLockedH3 || isLockedLimit}
                    className="w-full bg-gold hover:bg-[#b8972e] text-navy py-4 rounded-xl font-extrabold shadow-xl shadow-gold/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>Processing Modification <Loader2 className="w-5 h-5 animate-spin" /></>
                    ) : (
                        <>Confirm New Itinerary <ArrowRight className="w-5 h-5" /></>
                    )}
                </button>
            </div>
        </div>
      </main>

    </div>
  );
}

// Komponen ikon kecil yang terlewat di import atas
function ChevronDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}