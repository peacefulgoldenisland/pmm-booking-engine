"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Calendar, ArrowRight, Ship, ShieldCheck, 
  CheckCircle2, Sparkles, BedDouble, Minus, Plus, Loader2, 
  DoorOpen, Flame, ShoppingCart, Star, Anchor, Compass, Info, Bell
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const defaultCabins = [
  { name: "Private Cabin Sea View", desc: "A premium cabin option with stunning ocean views right from your bed.", price: "4,600K", image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop", popular: true, maxCapacity: 8 },
  { name: "Private Cabin Standard", desc: "Comfortable private room for extra privacy during the voyage.", price: "4,200K", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop", popular: false, maxCapacity: 4 },
  { name: "Down Deck Cabin (2 Pax)", desc: "Cozy lower-deck cabin designed for couples or friends traveling together.", price: "3,800K", image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop", popular: false, maxCapacity: 16 },
  { name: "Down Deck Cabin (1 Pax)", desc: "Exclusive lower-deck cabin tailored for solo travelers.", price: "3,800K", image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop", popular: false, maxCapacity: 2 },
  { name: "Sharing Deck Upstair", desc: "Spacious shared sleeping area on the upper deck with ocean breeze.", price: "3,600K", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop", popular: false, maxCapacity: 22 }
];

export default function Home() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [cabins, setCabins] = useState<any[]>(defaultCabins);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [verifiedReviews, setVerifiedReviews] = useState<any[]>([]);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCabins, setSelectedCabins] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === REAL-TIME INVENTORY STATE ===
  const [bookedSeats, setBookedSeats] = useState<Record<string, number>>({});
  
  // === WAITLIST STATE ===
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistCabin, setWaitlistCabin] = useState('');
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', phone: '', pax: 1 });
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('status', '==', 'PUBLISHED'));
        const snap = await getDocs(q);
        const reviewsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVerifiedReviews(reviewsData.filter((r: any) => r.rating >= 4).slice(0, 8)); 
      } catch (error) {
        console.error("Error fetching reviews", error);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const getNextSaturdays = () => {
      const dates = [];
      let d = new Date();
      const currentDay = d.getDay();
      
      if (currentDay === 5 || currentDay === 6) d.setDate(d.getDate() + (6 - currentDay + 7)); 
      else d.setDate(d.getDate() + (6 - currentDay));

      for (let i = 0; i < 52; i++) {
        const nextSat = new Date(d);
        nextSat.setDate(d.getDate() + (i * 7));
        dates.push(nextSat.toISOString().split('T')[0]);
      }
      return dates;
    };

    const dates = getNextSaturdays();
    setAvailableDates(dates);
    setSelectedDate(dates[0]); 
  }, []);

  // === FETCH REAL AVAILABILITY (VIA SECURE API) ===
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate) return;
      setIsFetchingData(true);
      
      // Kosongkan keranjang jika pindah tanggal
      setSelectedCabins({});
      
      try {
        // Kita panggil API buatan kita, bukan tembak langsung ke Firestore!
        const res = await fetch(`/api/availability?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setBookedSeats(data.booked || {});
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchAvailability();
  }, [selectedDate]);

  const getAvailabilityInfo = (cabinName: string, maxCapacity: number) => {
    const booked = bookedSeats[cabinName] || 0;
    const available = Math.max(0, maxCapacity - booked);
    
    if (available === 0) return { text: "Fully Booked", isLow: true, availablePax: 0, maxPax: maxCapacity };
    if (available <= 4) return { text: `Only ${available} Seats Left!`, isLow: true, availablePax: available, maxPax: maxCapacity };
    return { text: `${available} Seats Available`, isLow: false, availablePax: available, maxPax: maxCapacity };
  };

  const handleAddPax = (cabinName: string, availablePax: number) => {
    setSelectedCabins(prev => {
      const current = prev[cabinName] || 0;
      if (current >= availablePax) return prev; 
      return { ...prev, [cabinName]: current + 1 };
    });
  };

  const handleRemovePax = (cabinName: string) => {
    setSelectedCabins(prev => {
      const current = prev[cabinName] || 0;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[cabinName]; 
        return newState;
      }
      return { ...prev, [cabinName]: current - 1 };
    });
  };

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/,/g, '').replace('K', '000').replace(/[^0-9]/g, '');
    return parseInt(numStr) || 0;
  };

  const totalPax = Object.values(selectedCabins).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(selectedCabins).reduce((total, [cabinName, count]) => {
    const cabinData = cabins.find(c => c.name === cabinName);
    const price = cabinData ? parsePrice(cabinData.price) : 0;
    return total + (price * count);
  }, 0);

  const handleProceedToCheckout = () => {
    setIsSubmitting(true);
    const cartString = encodeURIComponent(JSON.stringify(selectedCabins));
    const queryParams = new URLSearchParams({ date: selectedDate, cart: cartString, pax: totalPax.toString() });

    setTimeout(() => {
      router.push(`/checkout?${queryParams.toString()}`);
    }, 600);
  };

  const openWaitlistModal = (cabinName: string) => {
    setWaitlistCabin(cabinName);
    setWaitlistSuccess(false);
    setWaitlistForm({ name: '', email: '', phone: '', pax: 1 });
    setIsWaitlistModalOpen(true);
  };

  const submitWaitlist = async () => {
    setIsSubmittingWaitlist(true);
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: waitlistForm.name,
          email: waitlistForm.email,
          phone: waitlistForm.phone,
          paxCount: waitlistForm.pax,
          cabinClass: waitlistCabin,
          dateOfDeparture: selectedDate
        })
      });
      if (res.ok) {
        setWaitlistSuccess(true);
      } else {
        alert("Failed to join waitlist. Please try again.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const formatDateUI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isAuthChecking) {
    return <div className="min-h-screen bg-navy flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans overflow-x-hidden selection:bg-gold selection:text-navy pt-24">
      
      {isLoggedIn ? (
        <DashboardHeader />
      ) : (
        <nav className="fixed top-0 w-full z-50 bg-navy border-b border-white/5 py-4 shadow-xl">
          <div className="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Ship className="w-6 h-6 text-gold" />
              <span className="text-base font-bold tracking-widest text-white uppercase">PMM <span className="text-gold">Reserve</span></span>
            </div>
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 bg-white/5 hover:bg-gold border border-white/10 hover:border-gold text-white hover:text-navy px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md">
              Member Login <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 pb-24">
        
        <div className="bg-navy rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden mb-8 shadow-xl border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/20 bg-gold/10 text-gold font-bold text-[10px] uppercase tracking-wider mb-3">
                <Anchor className="w-3 h-3" /> B2C Expedition Terminal
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Lombok ➔ Komodo Fleet</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">Configure your group layout, select dates within 1 year, and request instant clearance.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl shrink-0 backdrop-blur-sm">
              <Compass className="w-5 h-5 text-gold animate-spin-slow" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Duration</p>
                <p className="text-sm font-bold text-white">4 Days 3 Nights Voyage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-navy">Available Accommodations</h2>
                <p className="text-xs text-gray-500 mt-0.5">Mix and match different cabins based on your companion architecture.</p>
              </div>
              {isFetchingData && <Loader2 className="w-5 h-5 animate-spin text-gold" />}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {cabins.map((cabin, idx) => {
                const availability = getAvailabilityInfo(cabin.name, cabin.maxCapacity);
                const paxInCabin = selectedCabins[cabin.name] || 0;
                const isSelected = paxInCabin > 0;
                const isFullyBooked = availability.availablePax === 0;

                return (
                  <motion.div 
                    key={idx}
                    className={`bg-white rounded-3xl overflow-hidden border transition-all flex flex-col md:flex-row shadow-sm ${
                      isSelected ? 'border-gold ring-1 ring-gold/30 shadow-md' : 'border-gray-200/70 hover:shadow-md'
                    } ${isFullyBooked ? 'opacity-80 grayscale-[20%]' : ''}`}
                  >
                    <div className="md:w-2/5 h-48 md:h-auto min-h-[180px] relative overflow-hidden shrink-0 bg-gray-100">
                      <img src={cabin.image} alt={cabin.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                      {cabin.popular && (
                        <span className="absolute top-4 left-4 bg-navy text-gold text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md border border-gold/20">
                          Most Popular
                        </span>
                      )}
                    </div>

                    <div className={`p-6 flex flex-col justify-between flex-1 transition-colors duration-300 ${isSelected ? 'bg-[#fdfbf7]' : 'bg-white'}`}>
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="text-lg font-extrabold text-navy leading-tight">{cabin.name}</h3>
                          <div className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
                            isFullyBooked ? 'bg-gray-100 text-gray-600 border-gray-200' :
                            availability.isLow ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                          }`}>
                            {availability.text}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">{cabin.desc}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-auto">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rate per Passenger</p>
                          <p className={`font-extrabold text-base ${isFullyBooked ? 'text-gray-400' : 'text-gold'}`}>IDR {cabin.price}</p>
                        </div>

                        <div className="self-end sm:self-auto w-full sm:w-auto">
                          {isFullyBooked ? (
                            <button 
                              onClick={() => openWaitlistModal(cabin.name)}
                              className="w-full sm:w-max px-5 py-2.5 bg-slate-900 text-white hover:bg-gold hover:text-navy text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                              <Bell className="w-3.5 h-3.5" /> Join Waitlist
                            </button>
                          ) : (
                            <div className="flex items-center justify-between sm:justify-start gap-3 bg-gray-50 border border-gray-200 p-1.5 rounded-xl w-full sm:w-max">
                              <button 
                                onClick={() => handleRemovePax(cabin.name)} disabled={paxInCabin === 0}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-navy border border-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-extrabold w-6 text-center text-navy">{paxInCabin}</span>
                              <button 
                                onClick={() => handleAddPax(cabin.name, availability.availablePax)} disabled={paxInCabin >= availability.availablePax}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-navy border border-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_50px_rgb(0,0,0,0.05)] border border-gray-200/80 relative">
                
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold" /> 1. Expedition Calendar
                </h3>
                <div className="relative group mb-6">
                  <select 
                    value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-navy font-bold text-sm px-4 py-4 rounded-xl focus:outline-none focus:border-gold cursor-pointer transition-colors shadow-sm appearance-none"
                  >
                    {availableDates.map(date => (
                      <option key={date} value={date}>{formatDateUI(date)}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 font-bold text-xs">▼</div>
                </div>

                <div className="bg-navy rounded-2xl p-5 text-white shadow-inner">
                  <h4 className="text-xs font-bold text-gold mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                    <ShoppingCart className="w-3.5 h-3.5" /> Live Manifest Manifest
                  </h4>

                  <div className="space-y-4 mb-6 min-h-[60px]">
                    <AnimatePresence mode="popLayout">
                      {Object.keys(selectedCabins).length === 0 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-400 italic text-center py-2">
                          No seats selected. Choose passengers from the list.
                        </motion.p>
                      )}

                      {Object.entries(selectedCabins).map(([cabinName, count]) => {
                        const cabinData = cabins.find(c => c.name === cabinName);
                        const price = cabinData ? parsePrice(cabinData.price) : 0;
                        return (
                          <motion.div 
                            key={cabinName} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex justify-between items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{count}x Guest{count > 1 ? 's' : ''}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate">{cabinName}</p>
                            </div>
                            <span className="font-bold text-gold">{(count * price).toLocaleString('id-ID')}</span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-dashed border-white/20 pt-4">
                    <div className="flex justify-between items-end mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Total Amount</span>
                      <span className="bg-gold text-navy px-2 py-0.5 rounded font-extrabold">{totalPax} PAX</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white tracking-tighter text-right">
                      {totalPrice.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-bold">IDR</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleProceedToCheckout} disabled={isSubmitting || totalPax === 0}
                  className="w-full bg-gold hover:bg-[#b8972e] text-navy py-4 rounded-xl font-extrabold shadow-lg shadow-gold/10 transition-all flex items-center justify-center gap-2 mt-5 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Clearance ({totalPax}) <ArrowRight className="w-4 h-4" /></>}
                </button>
                
                <div className="mt-4 flex items-start gap-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <Info className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    Sailing credentials and manifests are protected under strict maritime privacy encryptions.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* WAITLIST MODAL */}
      <Modal isOpen={isWaitlistModalOpen} onClose={() => setIsWaitlistModalOpen(false)} title="Join Waitlist">
        {waitlistSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-extrabold text-navy mb-2">You're on the list!</h3>
            <p className="text-gray-500 text-sm mb-6">We've sent a confirmation email. If a spot opens up in the <strong className="text-navy">{waitlistCabin}</strong>, we will notify you immediately.</p>
            <Button onClick={() => setIsWaitlistModalOpen(false)} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">The <strong className="text-navy">{waitlistCabin}</strong> is currently full for {formatDateUI(selectedDate)}. Drop your details below, and we'll email you if anyone cancels.</p>
            <Input label="Full Name *" value={waitlistForm.name} onChange={e => setWaitlistForm({...waitlistForm, name: e.target.value})} placeholder="John Doe" />
            <Input label="Email Address *" type="email" value={waitlistForm.email} onChange={e => setWaitlistForm({...waitlistForm, email: e.target.value})} placeholder="john@example.com" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="WhatsApp (Optional)" type="tel" value={waitlistForm.phone} onChange={e => setWaitlistForm({...waitlistForm, phone: e.target.value})} placeholder="+62..." />
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-500 mb-2">Total Guests</label>
                <input type="number" min="1" max="10" value={waitlistForm.pax} onChange={e => setWaitlistForm({...waitlistForm, pax: parseInt(e.target.value)})} className="w-full p-4 bg-white rounded-xl border border-gray-200 outline-none focus:border-gold" />
              </div>
            </div>
            <Button 
              onClick={submitWaitlist} 
              isLoading={isSubmittingWaitlist} 
              disabled={!waitlistForm.name || !waitlistForm.email}
              className="w-full mt-4"
            >
              <Bell className="w-4 h-4 mr-2" /> Notify Me
            </Button>
          </div>
        )}
      </Modal>

    </div>
  );
}