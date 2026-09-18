"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Loader2, Sparkles, Gift, 
  Ticket, Crown
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { DashboardHeader } from '@/components/layout/DashboardHeader'; 
import { Skeleton } from '@/components/ui/Skeleton';

import { RewardCatalog } from '@/components/rewards/RewardCatalog';
import { MyVouchers } from '@/components/rewards/MyVouchers';
import { RedeemModal } from '@/components/rewards/RedeemModal';
import type { User } from 'firebase/auth';
import type { GuestProfile } from '@/types/user';
import type { RewardCatalogItem, UserReward } from '@/types/voucher';

const FALLBACK_CATALOG: RewardCatalogItem[] = [
  { id: 'VOUCHER-50K', name: 'IDR 50,000 Privilege', desc: 'A quick treat. Applicable to any booking without restrictions.', cost: 5, value: 50000, iconName: 'Ticket' },
  { id: 'VOUCHER-100K', name: 'IDR 100,000 Privilege', desc: 'Perfect for Sharing Deck Upstair. Enjoy the ocean breeze for less.', cost: 10, value: 100000, iconName: 'Tag' },
  { id: 'VOUCHER-150K', name: 'IDR 150,000 Privilege', desc: 'Ideal for Down Deck Cabin (1 Pax). Solo travel made sweeter.', cost: 15, value: 150000, iconName: 'Gift' },
  { id: 'VOUCHER-250K', name: 'IDR 250,000 Privilege', desc: 'Best value for Down Deck Cabin (2 Pax). Upgrade your comfort.', cost: 25, value: 250000, iconName: 'Star' },
  { id: 'VOUCHER-350K', name: 'IDR 350,000 Privilege', desc: 'Premium savings. Recommended for Private Cabin Standard.', cost: 35, value: 350000, iconName: 'Gem' },
  { id: 'VOUCHER-500K', name: 'VVIP IDR 500,000 Privilege', desc: 'Maximum Limit Voucher! Highly recommended for Private Sea View.', cost: 50, value: 500000, iconName: 'Crown' },
];

export default function RewardsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<GuestProfile | null>(null);
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [myVouchers, setMyVouchers] = useState<UserReward[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-vouchers'>('catalog');
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [selectedReward, setSelectedReward] = useState<RewardCatalogItem | null>(null);
  const [modalState, setModalState] = useState<'confirm' | 'success' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Cek Autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data (REAL-TIME LISTENER)
  useEffect(() => {
    if (!user) return;
    setIsLoadingData(true);

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data() as GuestProfile);
    });

    const catalogRef = collection(db, 'rewards_catalog');
    const unsubscribeCatalog = onSnapshot(catalogRef, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedCatalog = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RewardCatalogItem));
        fetchedCatalog.sort((a, b) => a.cost - b.cost);
        setCatalog(fetchedCatalog);
      } else {
        setCatalog(FALLBACK_CATALOG);
      }
    });

    const rewardsRef = collection(db, 'user_rewards');
    const q = query(rewardsRef, where('userId', '==', user.uid));
    const unsubscribeRewards = onSnapshot(q, (snapshot) => {
      const vouchers: UserReward[] = [];
      snapshot.forEach(d => {
        vouchers.push({ id: d.id, ...d.data() } as UserReward);
      });
      vouchers.sort((a, b) => {
        const dateA = typeof a.redeemedAt === 'string' || typeof a.redeemedAt === 'number' ? new Date(a.redeemedAt).getTime() : (a.redeemedAt as any)?.toDate?.()?.getTime() || 0;
        const dateB = typeof b.redeemedAt === 'string' || typeof b.redeemedAt === 'number' ? new Date(b.redeemedAt).getTime() : (b.redeemedAt as any)?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      });
      setMyVouchers(vouchers);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching rewards data:", error);
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeCatalog();
      unsubscribeRewards();
    };
  }, [user]);

  // 3. Proses Penukaran Poin via API
  const handleRedeem = async () => {
    if (!user || !selectedReward) return;
    setIsRedeeming(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          rewardId: selectedReward.id,
          rewardName: selectedReward.name,
          cost: selectedReward.cost,
          discountValue: selectedReward.value
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Karena kita menggunakan onSnapshot, state userData (saldo) dan myVouchers akan 
      // otomatis ter-update sesaat setelah dokumen Firestore berubah di backend!
      setModalState('success');
    } catch (error: unknown) {
      const err = error as Error;
      setErrorMessage(err.message || 'Failed to redeem points.');
      setModalState('error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const openRedeemModal = (reward: RewardCatalogItem) => {
    setSelectedReward(reward);
    setModalState('confirm');
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-[var(--color-gold-500)] animate-spin mb-4" />
      </div>
    );
  }

  // Jika Tamu Belum Login
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-900)] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden font-sans">
        <DashboardHeader /> 
        <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=2000&auto=format&fit=crop")' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-gold-500)]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-md mt-20 p-12 bg-white/5 backdrop-blur-md rounded-sm border border-white/10 shadow-luxury">
          <div className="w-20 h-20 bg-[var(--color-gold-500)]/10 rounded-full border border-[var(--color-gold-500)]/20 flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Crown className="w-10 h-10 text-[var(--color-gold-500)]" />
          </div>
          <h1 className="text-3xl font-serif text-white mb-4">VVIP Guild</h1>
          <p className="text-gray-400 mb-10 leading-relaxed font-light text-sm">Exclusive cabin privileges up to IDR 500,000. Please authenticate your session to access the guild catalog.</p>
          <Button onClick={() => router.push('/login')} className="w-full !rounded-sm !py-4 uppercase tracking-widest text-xs">
            Authenticate Session <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] font-sans pb-24 pt-24">
      <DashboardHeader />

      {/* FULL WIDTH LUXURY HERO HEADER */}
      <div className="bg-[var(--color-navy-900)] pt-12 pb-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-gold-500)]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent mix-blend-overlay" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[var(--color-gold-500)]/10 text-[var(--color-gold-400)] font-bold text-[10px] uppercase tracking-widest mb-4 border border-[var(--color-gold-500)]/20">
              <Crown className="w-3.5 h-3.5" /> PMM Reserve
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif text-white leading-tight mb-3">Rewards Guild</h1>
            <p className="text-gray-400 font-light text-sm max-w-lg leading-relaxed">
              Exchange your accumulated voyage miles for exclusive cabin privileges. Catalog offerings are dynamically updated by the harbor master.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 lg:p-8 backdrop-blur-md min-w-[240px] text-center md:text-right rounded-sm shadow-inner">
            <p className="text-[10px] font-bold text-[var(--color-gold-400)] uppercase tracking-widest mb-1.5 flex items-center justify-center md:justify-end gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Mileage Balance
            </p>
            {isLoadingData ? (
              <Skeleton variant="text" className="w-32 h-10 md:ml-auto mt-2 bg-white/20" />
            ) : (
              <p className="text-5xl font-serif text-white tracking-tight">
                {userData?.pointsBalance || 0} <span className="text-lg font-sans text-gray-400 font-normal">Pts</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-10 relative z-20">
        
        {/* EDITORIAL TAB NAVIGATION */}
        <div className="flex overflow-x-auto no-scrollbar gap-8 mb-10 border-b border-gray-200 w-full bg-white px-8 pt-8 rounded-t-sm shadow-sm">
          <button 
            onClick={() => setActiveTab('catalog')} 
            className={`pb-4 flex items-center gap-2 font-medium text-sm transition-all whitespace-nowrap relative ${activeTab === 'catalog' ? 'text-[var(--color-navy-900)]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Gift className="w-4 h-4" /> Privilege Catalog
            {activeTab === 'catalog' && <motion.div layoutId="activeTabReward" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--color-navy-900)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('my-vouchers')} 
            className={`pb-4 flex items-center gap-2 font-medium text-sm transition-all whitespace-nowrap relative ${activeTab === 'my-vouchers' ? 'text-[var(--color-navy-900)]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Ticket className="w-4 h-4" /> Active Codes
            {activeTab === 'my-vouchers' && <motion.div layoutId="activeTabReward" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--color-navy-900)]" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          
          {/* TAB 1: CATALOG */}
          {activeTab === 'catalog' && (
            <RewardCatalog 
              catalog={catalog} 
              isLoadingData={isLoadingData} 
              userData={userData} 
              openRedeemModal={openRedeemModal} 
            />
          )}

          {/* TAB 2: MY VOUCHERS */}
          {activeTab === 'my-vouchers' && (
            <MyVouchers 
              myVouchers={myVouchers} 
              isLoadingData={isLoadingData} 
            />
          )}

        </AnimatePresence>
      </main>

      {/* MODAL REDEEM */}
      <RedeemModal 
        isOpen={!!selectedReward} 
        onClose={() => { setSelectedReward(null); setModalState('confirm'); }}
        selectedReward={selectedReward}
        modalState={modalState}
        isRedeeming={isRedeeming}
        errorMessage={errorMessage}
        handleRedeem={handleRedeem}
        onRestart={() => setModalState('confirm')}
        onInspectInventory={() => {
          setSelectedReward(null); 
          setModalState('confirm'); 
          setActiveTab('my-vouchers');
        }}
      />

    </div>
  );
}