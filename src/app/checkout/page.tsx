"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, 
  ShieldCheck, MapPin, CheckCircle2, UploadCloud, 
  BedDouble, FileText, Loader2, ChevronRight, Lock,
  Ticket, XCircle, Info, Landmark, QrCode, CreditCard, CircleDollarSign, ChevronDown,
  Globe,
  Utensils, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import type { UserReward } from '@/types/voucher';
import type { MasterCabin } from '@/types/voyage';

interface PassengerDetail {
  id: number;
  cabinId: string; 
  fullName: string;
  gender: string;
  placeOfBirth: string;
  dateOfBirth: string;
  age: number;
  passportNumber: string;
  nationality: string;
  dietaryRequirements: string;
  passportFileUrl: string;
}

const PAYMENT_METHODS: Array<{ id: string; title: string; desc: string; icon: any; disabled: boolean; tag?: string }> = [
  { id: 'DIRECT_TRANSFER', title: 'Transfer Langsung', desc: 'Transfer Bank & QRIS Cepat', icon: Landmark, disabled: false },
  { id: 'PAY_LATER', title: 'Bayar Nanti / Chat Admin', desc: 'Hubungi Admin via WhatsApp untuk DP / Persetujuan', icon: MessageCircle, disabled: false },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedDate = searchParams.get('date') || '';
  const cartParam = searchParams.get('cart') || '{}';
  const paxCount = parseInt(searchParams.get('pax') || '0', 10);

  const initialCart = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(cartParam)) as Record<string, number>;
    } catch (error) {
      return {};
    }
  }, [cartParam]);

  const [basePrice, setBasePrice] = useState(0);
  const [isFetchingPrice, setIsFetchingPrice] = useState(true);
  const [cabinDetails, setCabinDetails] = useState<MasterCabin[]>([]);
  const [cabinMap, setCabinMap] = useState<Record<string, string>>({});
  
  // Auth Guard States
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Form States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [uploadingState, setUploadingState] = useState<{ [key: number]: boolean }>({});
  const [paymentMethod, setPaymentMethod] = useState('DIRECT_TRANSFER');
  
  // Voucher States
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<UserReward | null>(null);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. AUTH GUARD (Wajib Login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      setCurrentUser(user);
      setEmail(user.email || '');
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().phone) {
          setPhone(userDoc.data().phone);
        }
      } catch (err) {
        console.error("Error fetching user data", err);
      } finally {
        setTimeout(() => setIsAuthChecking(false), 500);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Inisialisasi Form Penumpang
  useEffect(() => {
    if (isAuthChecking) return; 

    if (!selectedDate || Object.keys(initialCart).length === 0) {
      router.push('/');
      return;
    }

    let paxIndex = 1;
    const initialPassengers: PassengerDetail[] = [];
    
    Object.entries(initialCart).forEach(([cabinId, count]) => {
      for (let i = 0; i < count; i++) {
        initialPassengers.push({
          id: paxIndex++,
          cabinId: cabinId,
          fullName: '',
          gender: '',
          placeOfBirth: '',
          dateOfBirth: '',
          age: 0,
          passportNumber: '',
          nationality: '',
          dietaryRequirements: 'None',
          passportFileUrl: ''
        });
      }
    });
    
    setPassengers(initialPassengers);
  }, [initialCart, selectedDate, router, isAuthChecking]);

  // 3. Fetch Harga Dinamis dari Products (MasterCabins)
  useEffect(() => {
    const fetchAndCalculatePrice = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsMap: Record<string, MasterCabin> = {};
        const tempNameMap: Record<string, string> = {};
        
        productsSnapshot.forEach(docSnap => {
          const cabinData = { id: docSnap.id, ...docSnap.data() } as MasterCabin;
          productsMap[docSnap.id] = cabinData;
          tempNameMap[docSnap.id] = cabinData.name || 'Cabin';
        });
        
        setCabinDetails(Object.values(productsMap));
        setCabinMap(tempNameMap);

        let calculatedTotal = 0;

        Object.entries(initialCart).forEach(([cabinId, count]) => {
          const cabin = productsMap[cabinId];
          let priceNum = 0;
          if (cabin && cabin.price) {
            priceNum = Number(cabin.price);
          }
          calculatedTotal += (priceNum * count);
        });
        
        setBasePrice(calculatedTotal);
      } catch (error) {
        console.error("Error calculating price:", error);
      } finally {
        setIsFetchingPrice(false);
      }
    };

    if (Object.keys(initialCart).length > 0) {
      fetchAndCalculatePrice();
    }
  }, [initialCart]);

  const discountAmount = appliedVoucher ? appliedVoucher.discountValue : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Voucher Logic
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !currentUser) return;
    setIsVerifyingVoucher(true);
    setVoucherError('');

    try {
      const q = query(collection(db, 'user_rewards'), where('userId', '==', currentUser.uid), where('status', '==', 'ACTIVE'));
      const querySnapshot = await getDocs(q);
      let foundVoucher = null;

      querySnapshot.forEach((doc) => {
        const shortCode = doc.id.split('-').pop()?.toUpperCase();
        if (shortCode === voucherCode.trim().toUpperCase() || doc.id === voucherCode.trim()) {
          foundVoucher = { id: doc.id, ...doc.data() };
        }
      });

      if (!foundVoucher) throw new Error("Invalid or expired voucher code.");
      setAppliedVoucher(foundVoucher as UserReward);
      setVoucherCode('');
    } catch (error: unknown) {
      const err = error as Error;
      setVoucherError(err.message);
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  const removeVoucher = () => setAppliedVoucher(null);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handlePassengerChange = (id: number, field: keyof PassengerDetail, value: string | number) => {
    setPassengers(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'dateOfBirth') updated.age = calculateAge(value as string);
        return updated;
      }
      return p;
    }));
  };

  // Upload ke R2 Bucket
  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [id]: true }));
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      handlePassengerChange(id, 'passportFileUrl', data.url); 
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(`Failed to upload passport: ${error.message}`);
    } finally {
      setUploadingState(prev => ({ ...prev, [id]: false }));
    }
  };

  const validateForm = () => {
    if (!email || !phone || !pickupArea || !pickupLocation) return false;
    for (const p of passengers) {
      if (!p.fullName) {
        return false;
      }
    }
    return true;
  };

  const handleProceedToPayment = () => {
    setErrorMessage('');
    if (Object.values(uploadingState).some(state => state === true)) {
      setErrorMessage('Please wait for all passports to finish uploading.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields and upload passports for all guests.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsModalOpen(true);
  };

  const confirmAndPay = async () => {
    setIsModalOpen(false);
    setIsLoading(true);

    try {
      let token = '';
      if (currentUser) {
        token = await currentUser.getIdToken();
      }

      const payload = {
        booking: { 
          date: selectedDate, 
          voyageScheduleId: selectedDate,
          cart: initialCart, 
          cabin: Object.keys(initialCart).map(id => cabinMap[id] || id).join(', '), 
          pax: paxCount, 
          total: finalPrice, 
          basePrice: basePrice,
          discountAmount: discountAmount,
          voucherId: appliedVoucher?.id || null,
          bookingSource: "B2C_MEMBER",
          paymentMethod: paymentMethod 
        },
        contact: { email, phone, pickupArea, pickupLocation },
        passengers 
      };

      const response = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to initiate booking');

      if (appliedVoucher?.id) {
        await updateDoc(doc(db, 'user_rewards', appliedVoucher.id), {
          status: 'USED',
          usedOnOrderId: result.orderId,
          usedAt: new Date().toISOString()
        });
      }

      router.push(`/payment?order_id=${result.orderId}`);
    } catch (error: unknown) {
      const err = error as Error;
      console.error(err);
      setErrorMessage(err.message);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSubtotal = (cabinId: string, count: number) => {
    const matchedCabin = cabinDetails.find(c => c.id === cabinId);
    let priceNum = matchedCabin?.price ? Number(matchedCabin.price) : 0;
    return priceNum * count;
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] font-sans">
        <header className="bg-white border-b border-gray-200 py-5 px-6"><Skeleton className="w-32 h-6" /></header>
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
          <Skeleton className="w-64 h-10 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8"><Skeleton className="w-full h-64 rounded-sm" /><Skeleton className="w-full h-96 rounded-sm" /></div>
            <div className="lg:col-span-4"><Skeleton className="w-full h-[500px] rounded-sm" /></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] pb-24 font-sans">
      
      {/* LUXURY HEADER & PROGRESS BAR */}
      <header className="bg-white border-b border-gray-200 pt-6 pb-5 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button onClick={() => router.back()} className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Modify Selection
          </button>
          
          <div className="flex items-center gap-3 md:gap-6 self-center">
            <div className="flex items-center gap-2 text-[var(--color-gold-600)]">
              <div className="w-5 h-5 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center font-bold text-[10px]">1</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Manifest</span>
            </div>
            <div className="w-8 md:w-16 h-px bg-gray-300" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center font-bold text-[10px]">2</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Payment</span>
            </div>
            <div className="w-8 md:w-16 h-px bg-gray-300" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center font-bold text-[10px]">3</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Clearance</span>
            </div>
          </div>
          <div className="hidden md:block w-32" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
        
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-navy-900)] mb-2">Secure Checkout</h1>
          <p className="text-gray-500 font-light text-sm">Submit official passenger details to generate harbor clearance documents.</p>
        </div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-8 p-5 bg-red-50 border border-red-200 text-red-700 font-medium text-sm rounded-sm flex items-start gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: EDITORIAL FORMS */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* CONTACT & TRANSFER SECTION */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-10 rounded-sm shadow-sm border border-gray-200/60 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-gold-500)]" />
              <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                Contact & Transfers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input label="Email Address (For E-Ticket) *" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4"/>} required />
                <Input label="WhatsApp / Phone *" type="tel" placeholder="+62 812..." value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone className="w-4 h-4"/>} required />
                
                <div className="flex flex-col w-full relative">
                  <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Pickup Area *</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 pointer-events-none"><MapPin className="w-4 h-4" /></div>
                    <select value={pickupArea} onChange={(e) => { setPickupArea(e.target.value); setPickupLocation(''); }} className="w-full bg-[var(--color-surface-50)] border border-gray-200 text-[var(--color-navy-900)] px-4 py-3.5 pl-11 rounded-xl appearance-none outline-none hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15 transition-all text-sm font-medium cursor-pointer" required>
                      <option value="" disabled>Select Coverage Area</option>
                      <option value="Mataram">Mataram City</option>
                      <option value="Senggigi">Senggigi Area</option>
                      <option value="Kuta Mandalika">Kuta Mandalika</option>
                      <option value="Bangsal">Bangsal Harbor</option>
                    </select>
                    <div className="absolute right-4 text-gray-400 pointer-events-none"><ChevronDown className="w-4 h-4" /></div>
                  </div>
                </div>
                
                <Input label="Hotel Name / Detail Address *" placeholder={pickupArea ? `Where exactly in ${pickupArea}?` : "Select area first"} value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} disabled={!pickupArea} icon={<MapPin className="w-4 h-4"/>} required />
              </div>
            </motion.section>

            {/* PASSENGER MANIFEST SECTION */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl font-serif text-[var(--color-navy-900)] flex items-center gap-3">
                  Guest Manifest
                </h2>
              </div>
              
              <div className="space-y-8">
                {passengers.map((p, idx) => (
                  <div key={p.id} className="bg-white rounded-sm shadow-sm border border-gray-200/60 overflow-hidden relative">
                    {/* Header Card Penumpang */}
                    <div className={`px-6 md:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${idx === 0 ? 'bg-[var(--color-surface-50)]' : 'bg-white'}`}>
                      <h3 className="text-lg font-serif text-[var(--color-navy-900)] flex items-center gap-3">
                        Guest {p.id}
                        {idx === 0 && <span className="bg-[var(--color-gold-500)]/10 text-[var(--color-gold-600)] text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm border border-[var(--color-gold-500)]/20 font-bold">Lead Booker</span>}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Assigned:</span>
                        <div className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm border border-gray-200 text-[var(--color-navy-900)] bg-white shadow-sm flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-gray-400" /> {cabinMap[p.cabinId] || p.cabinId}
                        </div>
                      </div>
                    </div>
                    
                    {/* Form Fields Passenger */}
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <Input label="Full Name (As in Passport) *" value={p.fullName} onChange={(e) => handlePassengerChange(p.id, 'fullName', e.target.value)} placeholder="John Doe" icon={<User className="w-4 h-4"/>} required />
                      
                      <div className="flex flex-col w-full relative">
                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1 group relative w-fit">
                          Gender (Optional) 
                          <Info className="w-3 h-3 cursor-pointer text-gray-400 hover:text-[var(--color-gold-500)]" />
                          <div className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-48 bg-[var(--color-navy-900)] text-white text-[9px] p-2 rounded shadow-lg z-10 normal-case tracking-normal">
                            If left blank, our admin will contact you via WhatsApp to complete this detail later.
                          </div>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-4 text-gray-400 pointer-events-none"><User className="w-4 h-4" /></div>
                          <select value={p.gender} onChange={(e) => handlePassengerChange(p.id, 'gender', e.target.value)} className="w-full bg-[var(--color-surface-50)] border border-gray-200 text-[var(--color-navy-900)] px-4 py-3.5 pl-11 rounded-xl appearance-none outline-none hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15 transition-all text-sm font-medium cursor-pointer">
                            <option value="" disabled>Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                          <div className="absolute right-4 text-gray-400 pointer-events-none"><ChevronDown className="w-4 h-4" /></div>
                        </div>
                      </div>

                      <Input 
                        label={
                          <span className="flex items-center gap-1 group relative w-fit">
                            Place of Birth (Optional)
                            <Info className="w-3 h-3 cursor-pointer text-gray-400 hover:text-[var(--color-gold-500)]" />
                            <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-48 bg-[var(--color-navy-900)] text-white text-[9px] p-2 rounded shadow-lg z-10 font-normal normal-case">
                              If left blank, our admin will contact you via WhatsApp to complete this detail later.
                            </span>
                          </span>
                        } 
                        value={p.placeOfBirth} onChange={(e) => handlePassengerChange(p.id, 'placeOfBirth', e.target.value)} placeholder="City, Country" icon={<MapPin className="w-4 h-4"/>} 
                      />
                      
                      <div className="flex gap-4">
                        <div className="w-2/3">
                          <Input 
                            label={
                              <span className="flex items-center gap-1 group relative w-fit">
                                Date of Birth (Optional)
                                <Info className="w-3 h-3 cursor-pointer text-gray-400 hover:text-[var(--color-gold-500)]" />
                                <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-48 bg-[var(--color-navy-900)] text-white text-[9px] p-2 rounded shadow-lg z-10 font-normal normal-case">
                                  If left blank, our admin will contact you via WhatsApp to complete this detail later.
                                </span>
                              </span>
                            } 
                            type="date" value={p.dateOfBirth} onChange={(e) => handlePassengerChange(p.id, 'dateOfBirth', e.target.value)} 
                          />
                        </div>
                        <div className="w-1/3">
                          <Input label="Age" type="number" value={p.age} readOnly className="bg-gray-100 text-gray-500 font-bold cursor-not-allowed border-transparent shadow-inner text-center" />
                        </div>
                      </div>

                      <Input 
                        label={
                          <span className="flex items-center gap-1 group relative w-fit">
                            Nationality (Optional)
                            <Info className="w-3 h-3 cursor-pointer text-gray-400 hover:text-[var(--color-gold-500)]" />
                            <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-48 bg-[var(--color-navy-900)] text-white text-[9px] p-2 rounded shadow-lg z-10 font-normal normal-case">
                              If left blank, our admin will contact you via WhatsApp to complete this detail later.
                            </span>
                          </span>
                        } 
                        value={p.nationality} onChange={(e) => handlePassengerChange(p.id, 'nationality', e.target.value)} placeholder="e.g. British" icon={<Globe className="w-4 h-4"/>} 
                      />
                      
                      <div className="flex flex-col w-full relative">
                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest block">Dietary Restrictions</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-4 text-gray-400 pointer-events-none"><Utensils className="w-4 h-4" /></div>
                          <select value={p.dietaryRequirements} onChange={(e) => handlePassengerChange(p.id, 'dietaryRequirements', e.target.value)} className="w-full bg-[var(--color-surface-50)] border border-gray-200 text-[var(--color-navy-900)] px-4 py-3.5 pl-11 rounded-xl appearance-none outline-none hover:border-[var(--color-gold-400)] focus:border-[var(--color-gold-500)] focus:ring-4 focus:ring-[var(--color-gold-500)]/15 transition-all text-sm font-medium cursor-pointer">
                            <option value="None">None</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Halal">Halal</option>
                            <option value="Gluten-Free">Gluten-Free</option>
                          </select>
                          <div className="absolute right-4 text-gray-400 pointer-events-none"><ChevronDown className="w-4 h-4" /></div>
                        </div>
                      </div>

                      <Input 
                        label={
                          <span className="flex items-center gap-1 group relative w-fit">
                            Passport / ID Number (Optional)
                            <Info className="w-3 h-3 cursor-pointer text-gray-400 hover:text-[var(--color-gold-500)]" />
                            <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-48 bg-[var(--color-navy-900)] text-white text-[9px] p-2 rounded shadow-lg z-10 font-normal normal-case">
                              If left blank, our admin will contact you via WhatsApp to complete this detail later.
                            </span>
                          </span>
                        } 
                        value={p.passportNumber} onChange={(e) => handlePassengerChange(p.id, 'passportNumber', e.target.value)} placeholder="A1234567" className="uppercase font-mono tracking-widest" icon={<CreditCard className="w-4 h-4"/>} 
                      />
                      
                      <div className="flex flex-col justify-end">
                        <label className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1 group relative w-fit">
                          Upload Document (Optional)
                          <Info className="w-3 h-3 cursor-pointer text-gray-400 hover:text-[var(--color-gold-500)]" />
                          <div className="absolute hidden group-hover:block bottom-full left-0 mb-1 w-48 bg-[var(--color-navy-900)] text-white text-[9px] p-2 rounded shadow-lg z-10 normal-case tracking-normal">
                            If skipped, our admin will contact you via WhatsApp to complete this detail later.
                          </div>
                        </label>
                        <div className="relative h-[50px]"> 
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(p.id, e)} className="hidden" id={`passport-upload-${p.id}`} />
                          <label htmlFor={`passport-upload-${p.id}`} className={`flex items-center justify-center gap-2 h-full rounded-xl border border-dashed cursor-pointer transition-all text-xs font-bold uppercase tracking-widest ${uploadingState[p.id] ? 'border-[var(--color-gold-500)] bg-[var(--color-gold-50)] text-[var(--color-gold-600)]' : p.passportFileUrl ? 'border-green-500 bg-green-50 text-green-700 shadow-inner' : 'border-gray-300 hover:border-[var(--color-navy-800)] bg-[var(--color-surface-50)] hover:bg-gray-50 text-[var(--color-navy-900)]'}`}>
                            {uploadingState[p.id] ? (<><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>) : p.passportFileUrl ? (<><CheckCircle2 className="w-4 h-4" /> Verified</>) : (<><UploadCloud className="w-4 h-4 text-gray-400" /> Select File</>)}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: LUXURY SUMMARY WIDGET */}
          <div className="lg:col-span-4 relative">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[var(--color-navy-900)] p-8 rounded-sm shadow-luxury text-white lg:sticky lg:top-32">
              
              <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
                Order Summary
                <FileText className="w-4 h-4 text-[var(--color-gold-500)]" />
              </h3>
              
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between items-start">
                  <div className="text-gray-400 font-light">Departure</div>
                  <div className="font-semibold text-right text-white">
                    {formatDateUI(selectedDate)}
                  </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="text-gray-400 font-light">Route</div>
                  <div className="font-semibold text-right">Lombok ➔ Komodo</div>
                </div>

                {/* DYNAMIC CART LIST */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">
                    Accommodations
                  </div>
                  <div className="space-y-3">
                    {Object.entries(initialCart).map(([cabinId, count]) => (
                      <div key={cabinId} className="flex justify-between items-start">
                        <div className="pr-2">
                          <p className="text-sm font-medium text-white">{count}x Cabin{count > 1 ? 's' : ''}</p>
                          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{cabinMap[cabinId] || cabinId}</p>
                        </div>
                        <div className="text-sm font-medium text-white shrink-0">
                          {isFetchingPrice ? "..." : getSubtotal(cabinId, count).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className="border-t border-dashed border-white/20 pt-6 mb-6">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">
                  Payment Method
                </h4>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => !method.disabled && setPaymentMethod(method.id)}
                        disabled={method.disabled}
                        className={`w-full flex items-center justify-between p-4 rounded-sm border transition-all text-left ${
                          method.disabled 
                            ? 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-[var(--color-gold-500)]/10 border-[var(--color-gold-500)] shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                              : 'bg-white/5 border-white/10 hover:border-white/30 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${isSelected ? 'text-[var(--color-gold-500)]' : 'text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-[var(--color-gold-500)]' : 'text-white'}`}>{method.title}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{method.desc}</p>
                          </div>
                        </div>
                        {method.disabled && method.tag ? (
                          <span className="text-[8px] uppercase tracking-widest font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-sm">
                            {method.tag}
                          </span>
                        ) : (
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-[var(--color-gold-500)]' : 'border-white/30'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold-500)]" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VOUCHER SYSTEM */}
              <div className="border-t border-dashed border-white/20 pt-6 mb-8">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">
                  Privilege Code
                </h4>
                
                <AnimatePresence mode="wait">
                  {appliedVoucher ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-900/30 border border-green-500/30 p-4 rounded-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span className="font-serif text-green-400 text-sm">{appliedVoucher.rewardName}</span>
                        </div>
                        <p className="text-[9px] text-green-400/70 uppercase tracking-widest ml-5">Value Applied</p>
                      </div>
                      <button onClick={removeVoucher} className="p-1.5 bg-green-900/50 rounded-md hover:bg-green-900 transition-colors">
                        <XCircle className="w-4 h-4 text-green-300" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={voucherCode} 
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="ENTER CODE"
                          disabled={!currentUser}
                          className="flex-1 bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-xs font-bold tracking-widest text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-gold-500)] transition-colors disabled:opacity-50 uppercase"
                        />
                        <button 
                          onClick={handleApplyVoucher}
                          disabled={!voucherCode || isVerifyingVoucher || !currentUser}
                          className="bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-600)] text-[var(--color-navy-900)] px-5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {isVerifyingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {!currentUser && (
                        <p className="text-[9px] text-gray-500 mt-2 flex items-center gap-1 uppercase tracking-widest">
                          <Info className="w-3 h-3" /> Sign in to use privileges.
                        </p>
                      )}
                      {voucherError && <p className="text-[10px] text-red-400 mt-2 font-medium">{voucherError}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* === TOTAL PAYMENT === */}
              <div className="border-t border-white/10 pt-6 mb-8 relative">
                <div className="flex justify-between items-end mb-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Invoice</div>
                  <div className="text-[10px] font-bold text-[var(--color-navy-900)] bg-[var(--color-gold-500)] px-2 py-0.5 rounded-sm uppercase tracking-widest">
                    IDR
                  </div>
                </div>
                
                {isFetchingPrice ? (
                  <div className="h-10 bg-white/10 animate-pulse rounded-sm w-full mt-2" />
                ) : (
                  <div>
                    {appliedVoucher && (
                       <div className="flex justify-between items-center text-sm font-medium text-gray-500 line-through mb-1">
                         <span>Original Value</span>
                         <span>{basePrice.toLocaleString('id-ID')}</span>
                       </div>
                    )}
                    <div className="text-4xl font-serif text-white tracking-tight text-right mt-1">
                      {finalPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
                
                <p className="text-[9px] text-gray-500 mt-3 text-right leading-relaxed uppercase tracking-widest">
                  Inclusive of harbor taxes & exclusive member insurance.
                </p>
              </div>

              <Button onClick={handleProceedToPayment} variant="secondary" className="w-full !rounded-sm !py-4 text-xs uppercase tracking-widest" isLoading={isLoading} disabled={isFetchingPrice}>
                Initiate Transaction <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-[var(--color-gold-500)]" /> Encrypted Maritime Checkout
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Verify Manifest">
        <div className="space-y-6">
          <p className="text-gray-500 text-sm font-light leading-relaxed">
            Please verify all passenger details match official travel documents. The official boarding pass will be dispatched to <strong className="text-[var(--color-navy-900)] font-medium">{email}</strong>.
          </p>
          
          <div className="bg-[var(--color-surface-50)] p-5 rounded-sm border border-[var(--color-gold-300)] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 text-[var(--color-navy-900)] font-serif text-lg mb-2 relative z-10">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-gold-500)]" /> 1x Modification Privilege
            </div>
            <p className="text-gray-500 text-xs font-light leading-relaxed relative z-10">
              As a valued guest, you retain the right to reschedule this itinerary once prior to departure, subject to cabin availability.
            </p>
          </div>

          <div className="pt-4 flex flex-col md:flex-row gap-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full md:w-1/3 !rounded-sm !text-xs uppercase tracking-widest">
              Review
            </Button>
            <Button onClick={confirmAndPay} isLoading={isLoading} className="w-full md:w-2/3 !bg-[var(--color-navy-900)] hover:!bg-[var(--color-navy-800)] !rounded-sm !text-xs uppercase tracking-widest text-white shadow-none">
              Confirm & Remit IDR {finalPrice.toLocaleString('id-ID')}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-surface-50)] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[var(--color-gold-500)] animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}