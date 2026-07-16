"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, 
  ShieldCheck, MapPin, CheckCircle2, UploadCloud, 
  BedDouble, FileText, Loader2, ChevronRight, Lock,
  Ticket, XCircle, Info, Landmark, QrCode, CreditCard, CircleDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface PassengerDetail {
  id: number;
  cabinName: string; 
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

// Data Metode Pembayaran
const PAYMENT_METHODS = [
  { id: 'MANUAL_BANK', title: 'Bank Transfer', desc: 'BCA, Mandiri, BNI, BRI', icon: Landmark, disabled: false },
  { id: 'MANUAL_QRIS', title: 'QRIS', desc: 'GoPay, OVO, Dana, ShopeePay', icon: QrCode, disabled: false },
  { id: 'PAYPAL', title: 'PayPal', desc: 'USD / International Credit Card', icon: CircleDollarSign, disabled: false },
  { id: 'MIDTRANS', title: 'Credit Card', desc: 'Visa, Mastercard, JCB', icon: CreditCard, disabled: true, tag: 'Maintenance' },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Ekstraksi Parameter URL
  const selectedDate = searchParams.get('date') || '';
  const cartParam = searchParams.get('cart') || '{}';
  const paxCount = parseInt(searchParams.get('pax') || '0', 10);

  const initialCart = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(cartParam)) as Record<string, number>;
    } catch (error) {
      console.error("Invalid cart data", error);
      return {};
    }
  }, [cartParam]);

  // State Data Firestore & Harga
  const [basePrice, setBasePrice] = useState(0);
  const [isFetchingPrice, setIsFetchingPrice] = useState(true);
  const [cabinDetails, setCabinDetails] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State Contact & Pickup
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupArea, setPickupArea] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  
  // State Passengers & Payment
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [uploadingState, setUploadingState] = useState<{ [key: number]: boolean }>({});
  const [paymentMethod, setPaymentMethod] = useState('MANUAL_BANK'); // Default Payment
  
  // State Voucher System
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-Fill User Data jika sudah login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setEmail(user.email || '');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().phone) {
          setPhone(userDoc.data().phone);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Inisialisasi Form Penumpang
  useEffect(() => {
    if (!selectedDate || Object.keys(initialCart).length === 0) {
      router.push('/');
      return;
    }

    let paxIndex = 1;
    const initialPassengers: PassengerDetail[] = [];
    
    Object.entries(initialCart).forEach(([cabin, count]) => {
      for (let i = 0; i < count; i++) {
        initialPassengers.push({
          id: paxIndex++,
          cabinName: cabin,
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
  }, [initialCart, selectedDate, router]);

  // Fetch Harga Kabin dari Firestore
  useEffect(() => {
    const fetchAndCalculatePrice = async () => {
      try {
        const docRef = doc(db, 'settings', 'expedition');
        const docSnap = await getDoc(docRef);
        
        let calculatedTotal = 0;
        let fetchedCabins: any[] = [];

        if (docSnap.exists() && docSnap.data().cabinPackages) {
          fetchedCabins = docSnap.data().cabinPackages;
          setCabinDetails(fetchedCabins);
        }

        Object.entries(initialCart).forEach(([cabinName, count]) => {
          const matchedCabin = fetchedCabins.find((c: any) => c.name === cabinName);
          let priceNum = 0;
          
          if (matchedCabin && matchedCabin.price) {
            priceNum = parseInt(matchedCabin.price.replace(/,/g, '').replace('K', '000').replace(/[^0-9]/g, '')) || 0;
          } else {
            const nameLower = cabinName.toLowerCase();
            if (nameLower.includes('sea view')) priceNum = 4600000;
            else if (nameLower.includes('standard')) priceNum = 4200000;
            else if (nameLower.includes('down deck')) priceNum = 3800000;
            else priceNum = 3600000;
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

  // Kalkulasi Total Akhir
  const discountAmount = appliedVoucher ? appliedVoucher.discountValue : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // --- LOGIKA VERIFIKASI VOUCHER ---
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    if (!currentUser) {
      setVoucherError("You must be logged in to apply a voucher.");
      return;
    }

    setIsVerifyingVoucher(true);
    setVoucherError('');

    try {
      const q = query(
        collection(db, 'user_rewards'), 
        where('userId', '==', currentUser.uid),
        where('status', '==', 'ACTIVE')
      );
      
      const querySnapshot = await getDocs(q);
      let foundVoucher = null;

      querySnapshot.forEach((doc) => {
        const shortCode = doc.id.split('-').pop()?.toUpperCase();
        if (shortCode === voucherCode.trim().toUpperCase() || doc.id === voucherCode.trim()) {
          foundVoucher = { id: doc.id, ...doc.data() };
        }
      });

      if (!foundVoucher) throw new Error("Invalid or expired voucher code.");

      setAppliedVoucher(foundVoucher);
      setVoucherCode('');
    } catch (error: any) {
      setVoucherError(error.message);
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  const removeVoucher = () => setAppliedVoucher(null);

  // Kalkulasi Umur
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
    setPassengers(prev => 
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          if (field === 'dateOfBirth') updated.age = calculateAge(value as string);
          return updated;
        }
        return p;
      })
    );
  };

  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [id]: true }));
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
      handlePassengerChange(id, 'passportFileUrl', data.secure_url);
    } catch (err: any) {
      setErrorMessage(`Failed to upload passport: ${err.message}`);
    } finally {
      setUploadingState(prev => ({ ...prev, [id]: false }));
    }
  };

  const validateForm = () => {
    if (!email || !phone || !pickupArea || !pickupLocation) return false;
    for (const p of passengers) {
      if (!p.fullName || !p.gender || !p.placeOfBirth || !p.dateOfBirth || !p.passportNumber || !p.nationality || !p.passportFileUrl) {
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
      const payload = {
        booking: { 
          date: selectedDate, 
          cart: initialCart, 
          cabin: Object.keys(initialCart).join(', '), 
          pax: paxCount, 
          total: finalPrice, 
          basePrice: basePrice,
          discountAmount: discountAmount,
          voucherId: appliedVoucher?.id || null,
          bookingSource: currentUser ? "B2C_MEMBER" : "B2C_GUEST",
          paymentMethod: paymentMethod // DISUNTIKKAN KE API
        },
        contact: { email, phone, pickupArea, pickupLocation },
        passengers 
      };

      const response = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // Selalu redirect ke /payment (nanti logika gateway dihandle di sana/API)
      router.push(`/payment?order_id=${result.orderId}`);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSubtotal = (cabinName: string, count: number) => {
    const matchedCabin = cabinDetails.find((c: any) => c.name === cabinName);
    let priceNum = 0;
    if (matchedCabin && matchedCabin.price) {
      priceNum = parseInt(matchedCabin.price.replace(/,/g, '').replace('K', '000').replace(/[^0-9]/g, '')) || 0;
    } else {
      const nameLower = cabinName.toLowerCase();
      if (nameLower.includes('sea view')) priceNum = 4600000;
      else if (nameLower.includes('standard')) priceNum = 4200000;
      else if (nameLower.includes('down deck')) priceNum = 3800000;
      else priceNum = 3600000;
    }
    return priceNum * count;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans selection:bg-gold selection:text-navy">
      
      {/* HEADER & PROGRESS BAR */}
      <header className="bg-navy pt-6 pb-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button onClick={() => router.back()} className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors w-max group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Modify Cabin</span>
          </button>
          <div className="flex items-center gap-2 md:gap-4 self-center">
            <div className="flex items-center gap-2 text-gold">
              <div className="w-6 h-6 rounded-full bg-gold text-navy flex items-center justify-center font-bold text-xs">1</div>
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Details</span>
            </div>
            <div className="w-8 md:w-12 h-px bg-white/20" />
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-6 h-6 rounded-full border border-gray-500 text-gray-500 flex items-center justify-center font-bold text-xs">2</div>
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Payment</span>
            </div>
            <div className="w-8 md:w-12 h-px bg-white/20" />
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-6 h-6 rounded-full border border-gray-500 text-gray-500 flex items-center justify-center font-bold text-xs">3</div>
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">E-Ticket</span>
            </div>
          </div>
          <div className="hidden md:block w-24" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy mb-2">Secure Checkout</h1>
          <p className="text-gray-500">Please provide the required manifest details for harbor clearance.</p>
        </div>

        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }} className="mb-8 p-5 bg-red-50 border border-red-200 text-red-800 font-bold rounded-2xl flex items-center gap-3 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-red-500 shrink-0" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* CONTACT & PICKUP */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gold" />
              <h2 className="text-2xl font-extrabold text-navy mb-6 flex items-center gap-3 pb-6 border-b border-gray-100">
                <div className="bg-navy/5 p-2 rounded-xl"><Mail className="w-6 h-6 text-navy" /></div>
                Contact & Transfer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <Input label="Email Address (For E-Ticket) *" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="WhatsApp / Phone *" type="tel" placeholder="+62 812..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <div className="flex flex-col">
                   <label className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider text-[10px]">Pickup Area *</label>
                   <div className="relative">
                     <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <select value={pickupArea} onChange={(e) => { setPickupArea(e.target.value); setPickupLocation(''); }} className="w-full pl-12 pr-4 py-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 focus:border-gold focus:ring-1 focus:ring-gold outline-none font-bold text-navy appearance-none transition-colors cursor-pointer" required>
                        <option value="" disabled>Select Coverage Area</option>
                        <option value="Mataram">Mataram City</option>
                        <option value="Senggigi">Senggigi Area</option>
                        <option value="Kuta Mandalika">Kuta Mandalika</option>
                        <option value="Bangsal">Bangsal Harbor</option>
                     </select>
                   </div>
                </div>
                <div className="flex flex-col">
                  <Input label="Hotel Name / Detail Address *" placeholder={pickupArea ? `Where exactly in ${pickupArea}?` : "Select area first"} value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} disabled={!pickupArea} required />
                </div>
              </div>
            </motion.section>

            {/* PASSENGER MANIFEST */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl font-extrabold text-navy flex items-center gap-3">
                  <div className="bg-navy/5 p-2 rounded-xl"><User className="w-6 h-6 text-navy" /></div>
                  Guest Manifest
                </h2>
              </div>
              
              <div className="space-y-8">
                {passengers.map((p, idx) => (
                  <div key={p.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative">
                    <div className={`px-6 md:px-8 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${idx === 0 ? 'bg-navy border-navy' : 'bg-gray-50 border-gray-100'}`}>
                      <h3 className={`text-lg font-extrabold flex items-center gap-2 ${idx === 0 ? 'text-white' : 'text-navy'}`}>
                        Guest {p.id}
                        {idx === 0 && <span className="bg-gold text-navy text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ml-2 shadow-sm">Lead Booker</span>}
                      </h3>
                      
                      <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${idx === 0 ? 'text-gray-300' : 'text-gray-400'}`}>Assigned Cabin:</span>
                        <div className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md border flex items-center gap-1.5 shadow-sm ${idx === 0 ? 'border-white/20 text-white bg-white/10' : 'border-gold/30 text-navy bg-gold/5'}`}>
                          <Lock className={`w-3 h-3 ${idx === 0 ? 'text-gold' : 'text-gold'}`} />
                          {p.cabinName}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                      <Input label="Full Name (As in Passport) *" value={p.fullName} onChange={(e) => handlePassengerChange(p.id, 'fullName', e.target.value)} placeholder="John Doe" required />
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider text-[10px]">Gender *</label>
                        <select value={p.gender} onChange={(e) => handlePassengerChange(p.id, 'gender', e.target.value)} className="w-full p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 focus:border-gold outline-none font-bold text-navy transition-colors cursor-pointer" required>
                          <option value="" disabled>Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <Input label="Place of Birth *" value={p.placeOfBirth} onChange={(e) => handlePassengerChange(p.id, 'placeOfBirth', e.target.value)} placeholder="City, Country" required />
                      <div className="flex gap-4">
                        <div className="w-2/3">
                          <Input label="Date of Birth *" type="date" value={p.dateOfBirth} onChange={(e) => handlePassengerChange(p.id, 'dateOfBirth', e.target.value)} required />
                        </div>
                        <div className="w-1/3">
                          <Input label="Age" type="number" value={p.age} readOnly className="bg-gray-100 text-gray-400 font-bold cursor-not-allowed border-none" />
                        </div>
                      </div>

                      <Input label="Nationality *" value={p.nationality} onChange={(e) => handlePassengerChange(p.id, 'nationality', e.target.value)} placeholder="e.g. British" required />
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider text-[10px]">Dietary / Allergies</label>
                        <select value={p.dietaryRequirements} onChange={(e) => handlePassengerChange(p.id, 'dietaryRequirements', e.target.value)} className="w-full p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 focus:border-gold outline-none font-bold text-navy transition-colors cursor-pointer">
                          <option value="None">None</option>
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Vegan">Vegan</option>
                          <option value="Halal">Halal</option>
                          <option value="Gluten-Free">Gluten-Free</option>
                        </select>
                      </div>

                      <Input label="Passport / ID Number *" value={p.passportNumber} onChange={(e) => handlePassengerChange(p.id, 'passportNumber', e.target.value)} placeholder="A1234567" className="uppercase font-mono tracking-wider" required />
                      
                      <div className="flex flex-col justify-end">
                        <label className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider text-[10px]">Upload Document (Required) *</label>
                        <div className="relative h-[58px]"> 
                          <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(p.id, e)} className="hidden" id={`passport-upload-${p.id}`} />
                          <label htmlFor={`passport-upload-${p.id}`} className={`flex items-center justify-center gap-2 h-full rounded-xl border-2 border-dashed cursor-pointer transition-all ${uploadingState[p.id] ? 'border-gold bg-gold/5 text-gold' : p.passportFileUrl ? 'border-green-500 bg-green-50 text-green-700 shadow-inner' : 'border-gray-300 hover:border-gold bg-gray-50 hover:bg-gold/5 text-navy font-bold'}`}>
                            {uploadingState[p.id] ? (<><Loader2 className="w-5 h-5 animate-spin" /> Uploading securely...</>) : p.passportFileUrl ? (<><CheckCircle2 className="w-5 h-5" /> Document Verified</>) : (<><UploadCloud className="w-5 h-5 text-gray-400" /> Click to Browse</>)}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY WIDGET */}
          <div className="lg:col-span-4 relative">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-navy p-8 rounded-3xl shadow-2xl text-white lg:sticky lg:top-32 border border-navy/20">
              <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#F8F9FA] rounded-full -translate-y-1/2 shadow-inner" />
              <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#F8F9FA] rounded-full -translate-y-1/2 shadow-inner" />
              
              <h3 className="text-xl font-extrabold text-gold mb-6 border-b border-white/10 pb-6 flex items-center justify-between">
                Order Summary
                <FileText className="w-5 h-5 text-white/50" />
              </h3>
              
              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-start">
                  <div className="text-gray-400 text-sm"><CalendarIcon className="w-4 h-4 mb-1 inline mr-2 text-white/50" /> Departure</div>
                  <div className="font-bold text-right text-white bg-white/10 px-3 py-1 rounded-lg">
                    {formatDateUI(selectedDate)}
                  </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="text-gray-400 text-sm"><MapPin className="w-4 h-4 mb-1 inline mr-2 text-white/50" /> Route</div>
                  <div className="font-bold text-right">Lombok ➔ Komodo</div>
                </div>

                {/* DYNAMIC CART LIST */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <BedDouble className="w-4 h-4" /> Selected Cabins
                  </div>
                  <div className="space-y-3">
                    {Object.entries(initialCart).map(([cabinName, count]) => (
                      <div key={cabinName} className="flex justify-between items-start">
                        <div className="pr-2">
                          <p className="text-sm font-bold text-white">{count}x Guest{count > 1 ? 's' : ''}</p>
                          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{cabinName}</p>
                        </div>
                        <div className="text-sm font-bold text-gold shrink-0">
                          {isFetchingPrice ? "..." : getSubtotal(cabinName, count).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ===================== PAYMENT METHOD SELECTION (NEW) ===================== */}
              <div className="border-t border-dashed border-white/20 pt-6 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" /> Payment Method
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
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                          method.disabled 
                            ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' 
                            : isSelected 
                              ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-gold' 
                              : 'bg-white/5 border-white/10 hover:border-gold/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-gold text-navy' : 'bg-white/10 text-white'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-extrabold ${isSelected ? 'text-gold' : 'text-white'}`}>{method.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{method.desc}</p>
                          </div>
                        </div>
                        {method.disabled && method.tag ? (
                          <span className="text-[8px] uppercase tracking-widest font-bold bg-red-500/20 text-red-300 px-2 py-1 rounded">
                            {method.tag}
                          </span>
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-gold' : 'border-white/30'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-gold" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ===================== VOUCHER SYSTEM ===================== */}
              <div className="border-t border-dashed border-white/20 pt-6 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Promo Code
                </h4>
                
                <AnimatePresence mode="wait">
                  {appliedVoucher ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="font-bold text-green-400 text-sm">{appliedVoucher.rewardName}</span>
                        </div>
                        <p className="text-[10px] text-green-400/70 mt-0.5 uppercase tracking-widest ml-6">Code Applied Successfully</p>
                      </div>
                      <button onClick={removeVoucher} className="p-2 bg-green-500/20 rounded-lg hover:bg-green-500/40 transition-colors">
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
                          placeholder="e.g. ABCD56"
                          disabled={!currentUser}
                          className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold tracking-widest text-white placeholder:text-gray-500 focus:outline-none focus:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        />
                        <button 
                          onClick={handleApplyVoucher}
                          disabled={!voucherCode || isVerifyingVoucher || !currentUser}
                          className="bg-gold hover:bg-[#b8972e] text-navy px-4 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                        >
                          {isVerifyingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {!currentUser && (
                        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Sign in to use your VVIP vouchers.
                        </p>
                      )}
                      {voucherError && <p className="text-[10px] text-red-400 mt-2 font-bold">{voucherError}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* === TOTAL PAYMENT === */}
              <div className="border-t-2 border-dashed border-white/20 pt-6 mb-8 relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-gray-400 text-sm font-bold uppercase tracking-widest">Total Payment</div>
                  <div className="text-xs font-bold text-navy bg-gold px-2 py-0.5 rounded-md">
                    {paymentMethod === 'PAYPAL' ? 'USD/IDR' : 'IDR'}
                  </div>
                </div>
                
                {isFetchingPrice ? (
                  <div className="h-10 bg-white/10 animate-pulse rounded-lg w-full mt-2" />
                ) : (
                  <div>
                    {appliedVoucher && (
                       <div className="flex justify-between items-center text-sm font-bold text-gray-400 line-through mb-1">
                         <span>Original Price</span>
                         <span>{basePrice.toLocaleString('id-ID')}</span>
                       </div>
                    )}
                    <div className="text-4xl font-extrabold text-white tracking-tighter text-right">
                      {finalPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-gray-400 mt-3 text-right leading-relaxed">
                  Includes all harbor taxes, national park fees, and exclusive member insurance.
                </p>
              </div>

              <Button onClick={handleProceedToPayment} variant="secondary" className="w-full py-4 text-base rounded-xl hover:-translate-y-1 transition-all" isLoading={isLoading} disabled={isFetchingPrice}>
                Proceed to Payment <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-green-400" /> Secure Encrypted Checkout
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Your Voyage Details">
        <div className="space-y-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            Please ensure all passenger names match their passports exactly. We will send your official boarding pass to <strong className="text-navy">{email}</strong>.
          </p>
          
          <div className="bg-[#fdfaf5] p-5 rounded-2xl border border-gold/20 text-sm shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-20 h-20 bg-gold/10 rounded-tl-full" />
            <div className="flex items-center gap-3 text-navy font-extrabold mb-2 relative z-10">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> 1x Free Reschedule Guarantee
            </div>
            <p className="text-gray-600 leading-relaxed relative z-10">
              As a premium member benefit, you are eligible to reschedule this trip to the following week if sudden flight delays occur.
            </p>
          </div>

          <div className="pt-4 flex flex-col md:flex-row gap-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full md:w-1/3">
              Review Details
            </Button>
            <Button onClick={confirmAndPay} isLoading={isLoading} className="w-full md:w-2/3 bg-navy hover:bg-[#122643] text-white">
              Confirm & Pay IDR {finalPrice.toLocaleString('id-ID')}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-navy font-bold">Loading secure checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}