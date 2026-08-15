"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Loader2, Sparkles, Gift, ShieldCheck, 
  Ticket, Crown, CheckCircle2, AlertCircle, Clock, 
  Tag, Star, Gem
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DashboardHeader } from '@/components/layout/DashboardHeader'; 
import { Skeleton } from '@/components/ui/Skeleton';

// --- PEMETAAN IKON DINAMIS ---
const ICON_MAP: Record<string, any> = {
  Ticket, Gift, Crown, Tag, Star, Gem
};

const FALLBACK_CATALOG = [
  { id: 'VOUCHER-50K', name: 'IDR 50,000 Privilege', desc: 'A quick treat. Applicable to any booking without restrictions.', cost: 5, value: 50000, iconName: 'Ticket' },
  { id: 'VOUCHER-100K', name: 'IDR 100,000 Privilege', desc: 'Perfect for Sharing Deck Upstair. Enjoy the ocean breeze for less.', cost: 10, value: 100000, iconName: 'Tag' },
  { id: 'VOUCHER-150K', name: 'IDR 150,000 Privilege', desc: 'Ideal for Down Deck Cabin (1 Pax). Solo travel made sweeter.', cost: 15, value: 150000, iconName: 'Gift' },
  { id: 'VOUCHER-250K', name: 'IDR 250,000 Privilege', desc: 'Best value for Down Deck Cabin (2 Pax). Upgrade your comfort.', cost: 25, value: 250000, iconName: 'Star' },
  { id: 'VOUCHER-350K', name: 'IDR 350,000 Privilege', desc: 'Premium savings. Recommended for Private Cabin Standard.', cost: 35, value: 350000, iconName: 'Gem' },
  { id: 'VOUCHER-500K', name: 'VVIP IDR 500,000 Privilege', desc: 'Maximum Limit Voucher! Highly recommended for Private Sea View.', cost: 50, value: 500000, iconName: 'Crown' },
];

export default function RewardsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-vouchers'>('catalog');
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [selectedReward, setSelectedReward] = useState<any>(null);
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

  // 2. Fetch Data
  useEffect(() => {
    const fetchRewardsData = async () => {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());

        const catalogSnap = await getDocs(collection(db, 'rewards_catalog'));
        if (!catalogSnap.empty) {
          const fetchedCatalog = catalogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedCatalog.sort((a: any, b: any) => a.cost - b.cost);
          setCatalog(fetchedCatalog);
        } else {
          setCatalog(FALLBACK_CATALOG);
        }

        const rewardsRef = collection(db, 'user_rewards');
        const q = query(rewardsRef, where('userId', '==', user.uid));
        const rewardsSnap = await getDocs(q);
        const vouchers: any[] = [];
        rewardsSnap.forEach(doc => {
          vouchers.push({ id: doc.id, ...doc.data() });
        });
        
        vouchers.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
        setMyVouchers(vouchers);

      } catch (error) {
        console.error("Error fetching rewards data:", error);
        if (catalog.length === 0) setCatalog(FALLBACK_CATALOG);
      } finally {
        setTimeout(() => setIsLoadingData(false), 600); // Smooth skeleton transition
      }
    };

    fetchRewardsData();
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

      setUserData((prev: any) => ({ ...prev, pointsBalance: prev.pointsBalance - selectedReward.cost }));
      setMyVouchers(prev => [{
        id: 'new-' + Date.now(),
        rewardName: selectedReward.name,
        discountValue: selectedReward.value,
        status: 'ACTIVE',
        redeemedAt: new Date().toISOString()
      }, ...prev]);

      setModalState('success');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to redeem points.');
      setModalState('error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const openRedeemModal = (reward: any) => {
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
            <motion.div key="catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingData ? (
                Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="w-full h-[280px] rounded-sm shadow-sm" />
                ))
              ) : (
                catalog.map((reward) => {
                  const Icon = ICON_MAP[reward.iconName] || Ticket;
                  const canAfford = (userData?.pointsBalance || 0) >= reward.cost;

                  return (
                    <div key={reward.id} className="bg-white rounded-sm p-8 shadow-sm hover:shadow-luxury border border-gray-200/50 transition-all flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="w-12 h-12 bg-[var(--color-surface-50)] group-hover:bg-[var(--color-gold-50)] rounded-lg flex items-center justify-center mb-6 transition-colors border border-gray-100 group-hover:border-[var(--color-gold-200)]">
                        <Icon className="w-5 h-5 text-[var(--color-navy-800)] group-hover:text-[var(--color-gold-600)] transition-colors" />
                      </div>
                      
                      <h3 className="text-xl font-serif text-[var(--color-navy-900)] mb-2 pr-4">{reward.name}</h3>
                      <p className="text-xs text-gray-500 mb-8 font-light leading-relaxed flex-grow">{reward.desc}</p>
                      
                      <div className="pt-6 border-t border-gray-100 mt-auto flex items-end justify-between">
                        <div>
                          <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mb-1">Required Miles</p>
                          <div className="font-serif text-[var(--color-navy-900)] text-2xl">{reward.cost}</div>
                        </div>
                        <Button 
                          onClick={() => openRedeemModal(reward)}
                          disabled={!canAfford}
                          variant={canAfford ? 'primary' : 'outline'}
                          className="!rounded-sm !py-2.5 !px-5 !text-xs uppercase tracking-widest"
                        >
                          Redeem
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* TAB 2: MY VOUCHERS */}
          {activeTab === 'my-vouchers' && (
            <motion.div key="vouchers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-4xl mx-auto">
              {isLoadingData ? (
                 Array(3).fill(0).map((_, i) => (
                   <Skeleton key={i} className="w-full h-32 rounded-sm shadow-sm" />
                 ))
              ) : myVouchers.length === 0 ? (
                <div className="bg-white rounded-sm p-16 text-center border border-gray-200/50 shadow-sm">
                  <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                    <Ticket className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2">Vault Empty</h3>
                  <p className="text-gray-500 font-light text-sm">You have not redeemed any privilege codes yet.</p>
                </div>
              ) : (
                myVouchers.map(v => (
                  <div key={v.id} className={`bg-white rounded-sm p-6 md:p-8 border-l-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-luxury transition-shadow ${v.status === 'USED' ? 'border-l-gray-300 opacity-60' : 'border-l-[var(--color-gold-500)]'}`}>
                    <div className="flex items-start md:items-center gap-5">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${v.status === 'USED' ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-[var(--color-surface-50)] border-[var(--color-gold-200)] text-[var(--color-gold-600)]'}`}>
                        {v.status === 'USED' ? <Ticket className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-serif text-[var(--color-navy-900)] text-xl mb-1">{v.rewardName}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-light">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Authenticated</span>
                          <span className={`px-2 py-0.5 rounded-sm uppercase font-bold text-[9px] tracking-widest border ${v.status === 'USED' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {v.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[var(--color-surface-50)] px-6 py-4 rounded-sm text-left md:text-right border border-gray-200 border-dashed shrink-0 w-full md:w-auto">
                      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Authorization Code</p>
                      <p className="font-mono font-bold text-[var(--color-navy-900)] text-xl tracking-widest">{v.id.split('-').pop()?.toUpperCase()}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* MODAL REDEEM */}
      <Modal isOpen={!!selectedReward} onClose={() => { setSelectedReward(null); setModalState('confirm'); }} title="Privilege Authorization">
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            
            {modalState === 'confirm' && (
              <motion.div 
                key="confirm" 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }} 
                className="space-y-6 pt-2"
              >
                <div className="bg-[var(--color-surface-50)] p-8 rounded-sm border border-[var(--color-gold-200)] text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-gold-500)]/10 rounded-bl-full pointer-events-none" />
                  <Gift className="w-10 h-10 text-[var(--color-gold-600)] mx-auto mb-4" />
                  <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2 relative z-10">{selectedReward?.name}</h3>
                  <p className="text-xs text-gray-500 mb-8 font-light leading-relaxed relative z-10">{selectedReward?.desc}</p>
                  
                  <div className="bg-white p-5 rounded-sm border border-gray-200 flex justify-between items-center shadow-sm relative z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mileage Deduction</span>
                    <span className="text-xl font-serif text-red-600">-{selectedReward?.cost} Pts</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRedeem} 
                  isLoading={isRedeeming} 
                  className="w-full !py-4 uppercase tracking-widest text-xs !rounded-sm shadow-luxury"
                >
                  Authorize Deduction
                </Button>
              </motion.div>
            )}

            {modalState === 'success' && (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="text-center py-8 space-y-8"
              >
                <div className="w-20 h-20 bg-green-50/50 rounded-full flex items-center justify-center mx-auto shadow-sm border border-green-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-[var(--color-navy-900)] mb-3">Code Vaulted!</h3>
                  <p className="text-sm font-light text-gray-500 leading-relaxed px-4">The cryptographic discount code has been injected into your active inventory. You may utilize it on your next maritime checkout.</p>
                </div>
                <Button 
                  onClick={() => { setSelectedReward(null); setModalState('confirm'); setActiveTab('my-vouchers'); }} 
                  variant="outline" 
                  className="w-full !py-4 !rounded-sm uppercase tracking-widest text-xs"
                >
                  Inspect Inventory
                </Button>
              </motion.div>
            )}

            {modalState === 'error' && (
              <motion.div 
                key="error" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="text-center py-8 space-y-8"
              >
                <div className="w-20 h-20 bg-red-50/50 rounded-full flex items-center justify-center mx-auto border border-red-200">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-[var(--color-navy-900)] mb-3">Deduction Failed</h3>
                  <p className="text-sm font-light text-gray-500">{errorMessage}</p>
                </div>
                <Button 
                  onClick={() => setModalState('confirm')} 
                  variant="outline" 
                  className="w-full !py-4 !rounded-sm uppercase tracking-widest text-xs"
                >
                  Restart Protocol
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </Modal>

    </div>
  );
}