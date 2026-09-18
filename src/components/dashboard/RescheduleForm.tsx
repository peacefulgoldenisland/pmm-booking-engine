import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, ShieldAlert, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore'; 
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import type { Booking } from '@/types/booking';

interface RescheduleFormProps {
  booking: Booking;
  isLockedH3: boolean;
  isLockedLimit: boolean;
}

export function RescheduleForm({ booking, isLockedH3, isLockedLimit }: RescheduleFormProps) {
  const router = useRouter();
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Pemilihan Tanggal dari DatePicker
  const handleDateSelect = (date: Date) => {
    setSelectedDateObj(date);
    
    // Format YYYY-MM-DD aman timezone
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
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
        const oldDateVal = booking.dateOfDeparture;
        const oldDate = typeof oldDateVal === 'string' || typeof oldDateVal === 'number'
            ? new Date(oldDateVal)
            : (oldDateVal as any).toDate?.() || new Date();
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

  // Cek Ketersediaan Kuota Secara Real-time
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
        setTimeout(() => setIsCheckingAvailability(false), 500); 
      }
    };

    checkAvailability();
  }, [selectedDateStr, booking]);

  // Proses Reschedule
  const handleRescheduleSubmit = async () => {
    if (!booking || !selectedDateStr || !isAvailable) return;
    
    setIsSubmitting(true);
    try {
        const docRef = doc(db, 'bookings', booking.id);
        
        await updateDoc(docRef, {
            dateOfDeparture: selectedDateStr,
            rescheduleCount: ((booking.rescheduleCount as number) || 0) + 1,
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

  return (
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
