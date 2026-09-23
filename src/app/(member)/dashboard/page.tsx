"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Award, User, Shield, Plus, Anchor, 
  History, ArrowRight, ConciergeBell, Clock
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookingCard } from '@/components/dashboard/BookingCard';
import type { Booking } from '@/types/booking';
import type { GuestProfile } from '@/types/user';
import { PastVoyagesModal, ConciergeServicesModal } from '@/components/dashboard/DashboardModals';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<GuestProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [greeting, setGreeting] = useState("");
  
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [isPastModalOpen, setIsPastModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Real-time listener for User Profile (Points Balance & Roles)
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ uid: user.uid, email: user.email, ...docSnap.data() } as GuestProfile);
        } else {
          setUserProfile({ uid: user.uid, email: user.email, pointsBalance: 0 } as GuestProfile);
        }
      });

      // 2. Real-time listener for Bookings (Status Updates from Admin)
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', user.uid));
      const unsubscribeBookings = onSnapshot(q, (querySnapshot) => {
        const fetchedBookings: Booking[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedBookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });

        // Urutkan berdasarkan tanggal keberangkatan (Terdekat)
        fetchedBookings.sort((a, b) => {
          const dateA = typeof a.dateOfDeparture === 'string' || typeof a.dateOfDeparture === 'number' ? new Date(a.dateOfDeparture) : (a.dateOfDeparture as any)?.toDate?.() || new Date();
          const dateB = typeof b.dateOfDeparture === 'string' || typeof b.dateOfDeparture === 'number' ? new Date(b.dateOfDeparture) : (b.dateOfDeparture as any)?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
        });
        setBookings(fetchedBookings);
        setIsLoading(false);
      });

      return () => {
        unsubscribeUser();
        unsubscribeBookings();
      };
    });

    return () => unsubscribeAuth();
  }, [router]);

  const upcomingBookings = bookings.filter(b => {
    const d = typeof b.dateOfDeparture === 'string' || typeof b.dateOfDeparture === 'number' ? new Date(b.dateOfDeparture) : (b.dateOfDeparture as any)?.toDate?.() || new Date();
    return d >= new Date() || b.status !== 'PAID';
  });
  const pastBookings = bookings.filter(b => {
    const d = typeof b.dateOfDeparture === 'string' || typeof b.dateOfDeparture === 'number' ? new Date(b.dateOfDeparture) : (b.dateOfDeparture as any)?.toDate?.() || new Date();
    return d < new Date() && b.status === 'PAID';
  });

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-100)] font-sans pt-24 pb-24">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
          <Skeleton className="w-full h-[400px] rounded-sm mb-12" />
          <Skeleton className="w-48 h-8 mb-6" />
          <div className="space-y-4">
            <Skeleton className="w-full h-32 rounded-sm" />
            <Skeleton className="w-full h-32 rounded-sm" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-100)] font-sans pb-24 pt-24">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
        
        {/* ======================================================== */}
        {/* LUXURY EDITORIAL COMMAND CENTER (HERO + QUICK ACTIONS)   */}
        {/* ======================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-navy-900)] rounded-sm shadow-luxury relative overflow-hidden text-white border border-white/10 mb-12"
        >
          {/* Ornamen Latar */}
          <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-[var(--color-gold-500)]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent mix-blend-overlay" />
          
          {/* BAGIAN ATAS: Profil & Poin */}
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10 border-b border-white/5">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[var(--color-gold-400)] to-[var(--color-gold-600)] p-[2px] shadow-lg shrink-0">
                <div className="w-full h-full rounded-full bg-[var(--color-navy-800)] flex items-center justify-center overflow-hidden">
                  {userProfile?.photoUrl ? (
                    <Image src={userProfile.photoUrl as string} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" unoptimized={true} />
                  ) : (
                    <span className="text-3xl font-serif text-[var(--color-gold-500)]">{userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-[var(--color-gold-500)]" />}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[var(--color-gold-500)] text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Verified Member
                </p>
                <h2 className="text-3xl md:text-4xl font-serif text-white truncate max-w-[250px] md:max-w-[400px]">
                  {greeting}, <span className="italic text-[var(--color-gold-400)]">{userProfile?.fullName?.split(' ')[0] || 'Explorer'}</span>
                </h2>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="bg-white/5 border border-white/10 rounded-sm p-5 md:px-8 backdrop-blur-md flex flex-col items-center justify-center gap-2 flex-1 md:w-56 shadow-inner">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[var(--color-gold-500)]" /> Mileage Balance
                </p>
                <p className="text-3xl font-serif text-white leading-none tracking-tight">
                  {userProfile?.pointsBalance || 0}
                </p>
              </div>
            </div>
          </div>

          {/* BAGIAN BAWAH: Quick Access Portals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 relative z-10 divide-y sm:divide-y-0 sm:divide-x divide-white/5 bg-black/20">
            
            <button 
              onClick={() => setIsPastModalOpen(true)}
              className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/5 p-3 rounded-sm border border-white/10 group-hover:border-[var(--color-gold-500)]/30 transition-colors">
                  <History className="w-5 h-5 text-gray-300 group-hover:text-[var(--color-gold-400)]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-white mb-0.5">Booking History</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Past Bookings</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </button>

            <button 
              onClick={() => setIsServicesModalOpen(true)}
              className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/5 p-3 rounded-sm border border-white/10 group-hover:border-[var(--color-gold-500)]/30 transition-colors">
                  <ConciergeBell className="w-5 h-5 text-gray-300 group-hover:text-[var(--color-gold-400)]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-white mb-0.5">Help & Support</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Contact Us</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </button>

          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* MAIN FOCUSED CONTENT: UPCOMING EXPEDITIONS               */}
        {/* ======================================================== */}
        <div className="mb-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-serif text-[var(--color-navy-900)]">Upcoming Bookings</h2>
            <span className="bg-[var(--color-surface-50)] border border-gray-200 text-gray-500 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">
              {upcomingBookings.length} Trips
            </span>
          </div>
          {upcomingBookings.length > 0 && (
            <Button onClick={() => router.push('/')} variant="outline" className="!rounded-sm uppercase tracking-widest text-xs flex items-center gap-2 border-[var(--color-navy-900)] text-[var(--color-navy-900)] hover:bg-[var(--color-navy-900)] hover:text-white transition-all w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Book New Trip
            </Button>
          )}
        </div>
        
        {upcomingBookings.some(b => b.status === 'PENDING' || b.status === 'WAITING_VERIFICATION') && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-sm flex items-start gap-3 shadow-sm mb-6">
            <Clock className="w-5 h-5 shrink-0 mt-0.5 text-yellow-600" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1 font-bold text-yellow-900">Verification in Progress</strong>
              Your recent bookings are currently being reviewed. Please allow a maximum of <strong>1x24 hours</strong> for our admin team to verify your payment and issue your E-Ticket. We will notify you via email once verified.
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-sm p-16 text-center border border-gray-200/60 shadow-sm">
              <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                <Anchor className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">No upcoming trips</h3>
              <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">
                You don't have any upcoming trips. Ready to plan your next getaway?
              </p>
              <Button onClick={() => router.push('/')} variant="outline" className="!rounded-sm mx-auto uppercase tracking-widest text-xs">
                Book a Trip
              </Button>
            </div>
          ) : (
            upcomingBookings.map((booking) => (
              <BookingCard 
                key={booking.id}
                booking={booking}
                isExpanded={expandedBookingId === booking.id}
                onToggleExpand={toggleExpand}
                userProfile={userProfile}
              />
            ))
          )}
        </motion.div>

      </main>

      {/* ======================================================== */}
      {/* MODALS (PENGGANTI HALAMAN/TAB)                           */}
      {/* ======================================================== */}

      {/* MODAL 1: PAST VOYAGES */}
      <PastVoyagesModal 
        isOpen={isPastModalOpen}
        onClose={() => setIsPastModalOpen(false)}
        pastBookings={pastBookings}
        expandedBookingId={expandedBookingId}
        onToggleExpand={toggleExpand}
        userProfile={userProfile}
      />

      {/* MODAL 2: VVIP SERVICES */}
      <ConciergeServicesModal 
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
      />

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button onClick={() => router.push('/')} className="w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-full flex items-center justify-center shadow-luxury border-2 border-white focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:ring-offset-2">
          <Plus className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}