"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Mail, ArrowRight, Ship, Loader2, Sparkles, 
  Calendar, Users, ArrowLeft
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);

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

  // 2. Fetch Booking Data
  useEffect(() => {
    async function fetchBooking() {
      if (isAuthChecking) return;

      if (!orderId) {
        setIsLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'bookings', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBookingData({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching booking on success page:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooking();
  }, [orderId, isAuthChecking]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (isAuthChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-[var(--color-gold-500)] animate-spin mb-4" />
        <h2 className="text-xl font-serif text-[var(--color-navy-900)]">Finalizing Expedition Documents...</h2>
      </div>
    );
  }

  // Jika Data Tidak Ditemukan
  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-10 rounded-sm shadow-sm border border-gray-200 max-w-md w-full text-center">
          <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Manifest Not Found</h2>
          <p className="text-gray-500 text-sm font-light mb-8">We couldn't locate the reference number provided. Please check your member dashboard.</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full !rounded-sm !py-3 uppercase tracking-widest text-xs">
            Return to Vault
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col font-sans pb-24 relative overflow-hidden">
      
      {/* Background Ornament */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-gold-500)]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Editorial Navbar */}
      <nav className="bg-white py-6 border-b border-gray-200 relative z-10">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Ship className="w-5 h-5 text-[var(--color-gold-500)]" />
            <span className="text-xl tracking-widest text-[var(--color-navy-900)] uppercase hidden md:flex items-center gap-2">
              <span className="font-bold">PMM</span> 
              <span className="font-serif italic text-[var(--color-gold-500)] lowercase text-2xl relative top-[2px]">Reserve</span>
            </span>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-[10px] font-bold text-gray-500 hover:text-[var(--color-navy-900)] uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            Access Vault <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 mt-6 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl w-full bg-white p-10 md:p-16 rounded-sm shadow-luxury border border-gray-200/50 relative overflow-hidden text-center"
        >
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--color-gold-500)]" />
          
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-50/50 rounded-full flex items-center justify-center mx-auto mb-8 relative border border-green-100">
            <div className="absolute inset-0 border-[3px] border-green-400 rounded-full animate-ping opacity-20" />
            <CheckCircle className="w-10 h-10 text-green-500" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -top-3 -right-3 opacity-60">
               <Sparkles className="w-8 h-8 text-[var(--color-gold-500)]" />
            </motion.div>
          </div>
          
          <div className="max-w-xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-navy-900)] mb-4 leading-tight">Remittance Verified</h1>
            <p className="text-gray-500 text-sm font-light leading-relaxed mb-6">
              Your maritime expedition has been successfully authorized and your cabin is fully secured.
            </p>
            <div className="inline-block bg-[var(--color-surface-50)] px-6 py-2.5 rounded-sm border border-gray-200">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-0.5">Reference Number</span>
              <span className="font-mono font-bold text-[var(--color-navy-900)] text-lg tracking-widest">{orderId}</span>
            </div>
          </div>

          {/* Luxury Boarding Pass Strip */}
          <div className="bg-[var(--color-navy-900)] rounded-sm p-8 md:p-10 text-white relative overflow-hidden mb-12 text-left shadow-md flex flex-col md:flex-row md:items-center justify-between gap-8 border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[50px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row gap-8 lg:gap-16 w-full relative z-10">
              <div>
                <p className="text-[10px] uppercase text-gray-400 tracking-widest mb-1.5 font-bold">Departure Date</p>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[var(--color-gold-400)]" />
                  <p className="font-serif text-xl">{formatDate(bookingData?.date)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase text-gray-400 tracking-widest mb-1.5 font-bold">Passenger Count</p>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[var(--color-gold-400)]" />
                  <p className="font-serif text-xl">{bookingData?.pax} Guest(s)</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase text-gray-400 tracking-widest mb-1.5 font-bold">Points Earned</p>
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--color-gold-500)] text-[var(--color-navy-900)] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">Rewards</div>
                  <p className="font-serif text-xl text-[var(--color-gold-400)]">+{bookingData?.pointsEarned || Math.floor(bookingData?.total / 100000)} Pts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-xl mx-auto">
            <div className="flex items-center gap-4 bg-[var(--color-surface-50)] border border-gray-200 px-6 py-4 rounded-sm shadow-sm w-full">
              <Mail className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="text-left">
                <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">E-Ticket Dispatched</p>
                <p className="text-sm font-medium text-[var(--color-navy-900)] truncate max-w-[200px]">{bookingData?.contactEmail}</p>
              </div>
            </div>

            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full !rounded-sm !py-4 uppercase tracking-widest text-xs shrink-0"
            >
              Enter Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </motion.div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-surface-50)] flex items-center justify-center font-serif text-2xl text-[var(--color-navy-900)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)] mr-3"/> Sealing Voyage Credentials...</div>}>
      <SuccessContent />
    </Suspense>
  );
}