"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Phone, Globe, Edit3, Loader2, 
  CreditCard, Shield, Award, Utensils,
  FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          setUserProfile({ email: user.email, pointsBalance: 0 });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 600); // Smooth skeleton transition
      }
    });

    return () => unsubscribe();
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
                        src={userProfile.photoUrl} 
                        alt="Profile" 
                        width={128} 
                        height={128} 
                        className="w-full h-full object-cover"
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
            <div className="lg:col-span-8 p-8 md:p-10 relative">
              {/* Background Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                <Shield className="w-[400px] h-[400px] text-[var(--color-navy-900)]" />
              </div>

              <div className="mb-10">
                <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2">Personal Dossier</h2>
                <p className="text-gray-500 text-xs font-light leading-relaxed max-w-lg">
                  Maintaining accurate records ensures expedited maritime clearance and personalized concierge service during your voyage.
                </p>
              </div>

              {/* Data Grid Clean Editorial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
                
                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </p>
                  <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.fullName ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
                    {userProfile?.fullName || 'Pending submission'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Contact Number
                  </p>
                  <p className={`font-mono text-base tracking-widest border-b border-gray-100 pb-2 ${userProfile?.phone ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic font-sans tracking-normal'}`}>
                    {userProfile?.phone || 'Pending submission'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Nationality
                  </p>
                  <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.nationality ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
                    {userProfile?.nationality || 'Pending submission'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Gender
                  </p>
                  <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.gender ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
                    {userProfile?.gender || 'Pending submission'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> Passport / ID Number
                  </p>
                  <p className={`font-mono text-base tracking-widest uppercase border-b border-gray-100 pb-2 ${userProfile?.passportNumber ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic font-sans tracking-normal'}`}>
                    {userProfile?.passportNumber || 'Pending submission'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Utensils className="w-3.5 h-3.5" /> Dietary Restrictions
                  </p>
                  <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.dietaryRequirements ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
                    {userProfile?.dietaryRequirements || 'None specified'}
                  </p>
                </div>

              </div>
            </div>

            {/* KANAN (4 Kolom): Status & Rewards */}
            <div className="lg:col-span-4 bg-[var(--color-surface-50)] p-8 md:p-10 flex flex-col gap-8">
              
              {/* Rewards Block */}
              <div className="bg-[var(--color-navy-900)] p-6 rounded-sm relative overflow-hidden shadow-sm">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Award className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-medium text-[var(--color-gold-400)] uppercase tracking-widest mb-1">Total Reward Points</p>
                  <p className="text-4xl font-serif text-white tracking-tight mb-4">
                    {userProfile?.pointsBalance || 0}
                  </p>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[10px] text-gray-400 font-light leading-relaxed">Redeemable for cabin upgrades and concierge services on future voyages.</p>
                  </div>
                </div>
              </div>

              {/* Document Status Block */}
              <div>
                <h3 className="text-sm font-serif text-[var(--color-navy-900)] mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-gold-500)]" /> Clearance Status
                </h3>
                
                {userProfile?.passportFileUrl ? (
                  <div className="bg-white border border-green-200 p-5 rounded-sm shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <p className="font-serif text-[var(--color-navy-900)] text-sm">Identity Verified</p>
                    </div>
                    <p className="text-[11px] text-gray-500 font-light leading-relaxed mb-4">Your travel document has been vaulted and approved by harbor authority.</p>
                    <a 
                      href={userProfile.passportFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full bg-gray-50 border border-gray-200 hover:border-green-300 text-[var(--color-navy-900)] py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors text-center"
                    >
                      Inspect File
                    </a>
                  </div>
                ) : (
                  <div className="bg-white border border-red-200 p-5 rounded-sm shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="font-serif text-[var(--color-navy-900)] text-sm">Action Required</p>
                    </div>
                    <p className="text-[11px] text-gray-500 font-light leading-relaxed mb-4">Harbor authority strictly requires a valid passport or ID scan prior to departure.</p>
                    <Button 
                      onClick={() => router.push('/dashboard/profile/edit')}
                      variant="primary"
                      className="!bg-red-600 hover:!bg-red-700 w-full !py-2.5 !rounded-sm !text-[10px] uppercase tracking-widest !shadow-none"
                    >
                      Upload Document
                    </Button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </motion.div>

      </main>
    </div>
  );
}