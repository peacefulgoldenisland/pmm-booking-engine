"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Edit3, Shield, CheckCircle2
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PersonalDossierCard } from '@/components/profile/PersonalDossierCard';
import { ClearanceStatusCard } from '@/components/profile/ClearanceStatusCard';
import type { GuestProfile } from '@/types/user';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<GuestProfile | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      
      // REAL-TIME LISTENER: Profil dan Poin otomatis berubah ketika Admin melakukan update
      const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ email: user.email, ...docSnap.data() } as GuestProfile);
        } else {
          setUserProfile({ email: user.email, pointsBalance: 0 } as GuestProfile);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error listening to profile:", error);
        setIsLoading(false);
      });

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24">
        <DashboardHeader />
        <div className="bg-[var(--color-navy-900)] h-64 w-full" />
        <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-32 relative z-20">
          <Skeleton className="w-full h-[600px] rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24">
      <DashboardHeader />

      {/* LUXURY COVER BACKGROUND */}
      <div className="bg-[var(--color-navy-900)] h-72 w-full relative overflow-hidden">
        {/* Subtle Gold Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-gold-500)]/20 via-transparent to-transparent mix-blend-overlay" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--color-gold-500)]/10 rounded-full blur-[80px]" />
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-40 relative z-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-luxury border border-gray-200/60 overflow-hidden"
        >
          {/* ========================================= */}
          {/* HEADER AREA: AVATAR & MAIN ACTIONS        */}
          {/* ========================================= */}
          <div className="p-8 md:p-10 border-b border-gray-100 flex flex-col md:flex-row md:items-end justify-between gap-8 relative bg-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)]" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
              {/* Profile Picture */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
                  <div className="w-full h-full rounded-full bg-[var(--color-navy-800)] flex items-center justify-center overflow-hidden">
                    {userProfile?.photoUrl ? (
                      <Image 
                        src={userProfile.photoUrl as string} 
                        alt="Profile" 
                        width={128} 
                        height={128} 
                        className="w-full h-full object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <span className="text-4xl font-serif text-[var(--color-gold-500)]">
                        {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-12 h-12 text-[var(--color-gold-500)]" />}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              </div>

              {/* Title & Email */}
              <div>
                <div className="inline-flex items-center gap-1.5 mb-2 px-3 py-1 bg-[var(--color-surface-50)] border border-gray-200 rounded-sm">
                  <Shield className="w-3 h-3 text-[var(--color-gold-600)]" />
                  <span className="text-[9px] font-bold tracking-widest text-[var(--color-navy-900)] uppercase">Verified Member</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-navy-900)] leading-tight mb-1">
                  {userProfile?.fullName || 'Esteemed Guest'}
                </h1>
                <p className="text-gray-500 font-light text-sm tracking-wide">{auth.currentUser?.email}</p>
              </div>
            </div>

            {/* Aksi Utama di Kanan Atas */}
            <div className="w-full md:w-auto">
              <Button 
                onClick={() => router.push('/dashboard/profile/edit')}
                variant="outline"
                className="w-full md:w-auto !rounded-sm !py-3 !px-6 !text-xs uppercase tracking-widest"
              >
                <Edit3 className="w-3.5 h-3.5 mr-2" /> Modify Profile
              </Button>
            </div>
          </div>

          {/* ========================================= */}
          {/* BENTO GRID AREA: CONTENT SPLIT            */}
          {/* ========================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            
            {/* KIRI (8 Kolom): Personal Dossier */}
            <PersonalDossierCard userProfile={userProfile} />

            {/* KANAN (4 Kolom): Status & Rewards */}
            <ClearanceStatusCard 
              userProfile={userProfile} 
              onEditProfile={() => router.push('/dashboard/profile/edit')} 
            />

          </div>
        </motion.div>

      </main>
    </div>
  );
}