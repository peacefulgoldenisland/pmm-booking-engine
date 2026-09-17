"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Award, User, Shield, Plus, Anchor, 
  History, ArrowRight, ConciergeBell
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookingCard, Booking } from '@/components/dashboard/BookingCard';
import { PastVoyagesModal, ConciergeServicesModal } from '@/components/dashboard/DashboardModals';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
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
          setUserProfile({ uid: user.uid, email: user.email, ...docSnap.data() });
        } else {
          setUserProfile({ uid: user.uid, email: user.email, pointsBalance: 0 });
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
        fetchedBookings.sort((a, b) => new Date(b.dateOfDeparture).getTime() - new Date(a.dateOfDeparture).getTime());
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

  const upcomingBookings = bookings.filter(b => new Date(b.dateOfDeparture) >= new Date() || b.status !== 'PAID');
  const pastBookings = bookings.filter(b => new Date(b.dateOfDeparture) < new Date() && b.status === 'PAID');

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pt-24 pb-24">
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
    <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24 pt-24">
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
                    <Image src={userProfile.photoUrl} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-serif text-[var(--color-gold-500)]">{userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-[var(--color-gold-500)]" />}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[var(--color-gold-500)] text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> VVIP Protocol Active
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
                  <h3 className="font-serif text-lg text-white mb-0.5">Historical Logs</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Past Voyages</p>
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
                  <h3 className="font-serif text-lg text-white mb-0.5">Concierge Services</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">VVIP Privileges</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
            </button>

          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* MAIN FOCUSED CONTENT: UPCOMING EXPEDITIONS               */}
        {/* ======================================================== */}
        <div className="mb-6 pb-2 flex items-center justify-between">
          <h2 className="text-3xl font-serif text-[var(--color-navy-900)]">Active Manifests</h2>
          <span className="bg-[var(--color-surface-50)] border border-gray-200 text-gray-500 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">
            {upcomingBookings.length} Trips
          </span>
        </div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-sm p-16 text-center border border-gray-200/60 shadow-sm">
              <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                <Anchor className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">No upcoming voyages</h3>
              <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">
                Your manifest is currently empty. Curate your next grand maritime escape with us today.
              </p>
              <Button onClick={() => router.push('/')} variant="outline" className="!rounded-sm mx-auto uppercase tracking-widest text-xs">
                Explore Destinations
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