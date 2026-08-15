"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Ship, ShieldCheck, CheckCircle2, 
  Minus, Plus, Loader2, Anchor, Bell, Lock
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { Skeleton } from '@/components/ui/Skeleton';

const defaultCabins = [
  { 
    name: "Private Cabin Sea View", 
    desc: "A premium sanctuary offering panoramic ocean vistas right from your bed.", 
    price: "4,600K", 
    images: [
      "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2069&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop"
    ], 
    popular: true, 
    maxCapacity: 8 
  },
  { 
    name: "Private Cabin Standard", 
    desc: "An elegant private quarters designed for ultimate comfort and tranquility.", 
    price: "4,200K", 
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1572987669554-0ba2ba9aee1f?q=80&w=2070&auto=format&fit=crop"
    ], 
    popular: false, 
    maxCapacity: 4 
  },
  { 
    name: "Down Deck Cabin (2 Pax)", 
    desc: "Intimate lower-deck suite tailored for couples seeking a cozy maritime experience.", 
    price: "3,800K", 
    images: [
      "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=2070&auto=format&fit=crop"
    ], 
    popular: false, 
    maxCapacity: 16 
  },
  { 
    name: "Down Deck Cabin (1 Pax)", 
    desc: "Exclusive solitary retreat perfectly appointed for the discerning solo voyager.", 
    price: "3,800K", 
    images: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop"
    ], 
    popular: false, 
    maxCapacity: 2 
  },
  { 
    name: "Sharing Deck Upstair", 
    desc: "Open-air slumber under the stars with gentle ocean breezes on the upper deck.", 
    price: "3,600K", 
    images: [
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop"
    ], 
    popular: false, 
    maxCapacity: 22 
  }
];

export default function Home() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [cabins, setCabins] = useState<any[]>(defaultCabins);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [selectedCabins, setSelectedCabins] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<Record<string, number>>({});
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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
    let d = new Date();
    const currentDay = d.getDay();
    if (currentDay === 5 || currentDay === 6) d.setDate(d.getDate() + (6 - currentDay + 7)); 
    else d.setDate(d.getDate() + (6 - currentDay));
    d.setHours(0, 0, 0, 0);
    setSelectedDateObj(d);
    
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset*60*1000));
    setSelectedDateStr(localDate.toISOString().split('T')[0]);
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDateObj(date);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    setSelectedDateStr(localDate.toISOString().split('T')[0]);
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDateStr) return;
      setIsFetchingData(true);
      setSelectedCabins({});
      
      try {
        const res = await fetch(`/api/availability?date=${selectedDateStr}`);
        if (res.ok) {
          const data = await res.json();
          setBookedSeats(data.booked || {});
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setTimeout(() => setIsFetchingData(false), 600); // Smoother loading
      }
    };
    fetchAvailability();
  }, [selectedDateStr]);

  const getAvailabilityInfo = (cabinName: string, maxCapacity: number) => {
    const booked = bookedSeats[cabinName] || 0;
    const available = Math.max(0, maxCapacity - booked);
    
    if (available === 0) return { text: "Fully Booked", isLow: true, availablePax: 0, maxPax: maxCapacity };
    if (available <= 4) return { text: `${available} Left`, isLow: true, availablePax: available, maxPax: maxCapacity };
    return { text: "Available", isLow: false, availablePax: available, maxPax: maxCapacity };
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

  const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/,/g, '').replace('K', '000').replace(/[^0-9]/g, '')) || 0;
  
  const totalPax = Object.values(selectedCabins).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(selectedCabins).reduce((total, [cabinName, count]) => {
    const cabinData = cabins.find(c => c.name === cabinName);
    return total + ((cabinData ? parsePrice(cabinData.price) : 0) * count);
  }, 0);

  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    const cartString = encodeURIComponent(JSON.stringify(selectedCabins));
    const queryParams = new URLSearchParams({ date: selectedDateStr, cart: cartString, pax: totalPax.toString() });

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
        body: JSON.stringify({ ...waitlistForm, cabinClass: waitlistCabin, dateOfDeparture: selectedDateStr })
      });
      if (res.ok) setWaitlistSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  if (isAuthChecking) {
    return <div className="min-h-screen bg-[var(--color-navy-900)] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[var(--color-gold-500)] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      
      {isLoggedIn ? (
        <DashboardHeader />
      ) : (
        <nav className="fixed top-0 w-full z-50 bg-[var(--color-navy-900)]/90 backdrop-blur-md border-b border-white/5 py-4 transition-all">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Ship className="w-5 h-5 text-[var(--color-gold-500)]" />
              <span className="text-xl tracking-widest text-white flex items-center gap-2">
                <span className="font-bold uppercase">PMM</span> 
                <span className="font-serif italic text-[var(--color-gold-500)] lowercase text-2xl relative top-[2px]">Reserve</span>
              </span>
            </div>
            <button 
              onClick={() => router.push('/login')} 
              className="text-white hover:text-[var(--color-gold-500)] text-sm font-medium tracking-wide transition-colors"
            >
              Member Sign In
            </button>
          </div>
        </nav>
      )}

      {/* IMMERSIVE LUXURY HERO SECTION */}
      <section className="relative h-[65vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 animate-slow-zoom"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2070&auto=format&fit=crop")' }}
        />
        {/* Elegant Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy-900)]/80 via-[var(--color-navy-900)]/40 to-[var(--color-navy-900)]/90" />
        
        <div className="relative z-10 text-center px-4 max-w-3xl mt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center justify-center gap-2 mb-6">
              <div className="h-px w-8 bg-[var(--color-gold-500)]" />
              <span className="text-[var(--color-gold-500)] uppercase tracking-[0.2em] text-xs font-semibold">The Ultimate Voyage</span>
              <div className="h-px w-8 bg-[var(--color-gold-500)]" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
              Lombok to <span className="italic text-[var(--color-gold-400)]">Komodo</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base font-light tracking-wide max-w-xl mx-auto leading-relaxed">
              Experience the pinnacle of maritime luxury. Select your exquisite quarters and embark on a majestic 4-day, 3-night expedition across the Indonesian archipelago.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ALIGNMENT FIX: Margin Top Positif (mt-12 md:mt-16) dan Grid Sejajar */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-12 md:mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN - Cabin List */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8 pt-4">
            <div className="flex flex-col border-b border-gray-200 pb-4">
              <h2 className="text-3xl font-serif text-[var(--color-navy-900)]">Accommodations</h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {isFetchingData ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={`skel-${i}`} className="bg-white flex flex-col md:flex-row gap-6 pb-8 border-b border-gray-100">
                    <Skeleton className="w-full md:w-5/12 h-[250px] rounded-xl" />
                    <div className="flex flex-col justify-center flex-1 space-y-4">
                      <Skeleton variant="text" className="w-3/4 h-8 mb-2" />
                      <Skeleton variant="text" className="w-full h-4" />
                      <Skeleton variant="text" className="w-5/6 h-4" />
                      <Skeleton variant="text" className="w-1/3 h-6 mt-4" />
                    </div>
                  </div>
                ))
              ) : (
                cabins.map((cabin, idx) => {
                  const availability = getAvailabilityInfo(cabin.name, cabin.maxCapacity);
                  const paxInCabin = selectedCabins[cabin.name] || 0;
                  const isSelected = paxInCabin > 0;
                  const isFullyBooked = availability.availablePax === 0;

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.6 }}
                      className={`flex flex-col md:flex-row gap-6 md:gap-8 pb-8 border-b border-gray-200 last:border-0 transition-opacity ${isFullyBooked ? 'opacity-60' : 'opacity-100'}`}
                    >
                      {/* Image - Sharper corners, elegant proportions */}
                      <div className="w-full md:w-5/12 h-[280px] md:h-[240px] relative shrink-0 group">
                        <ImageCarousel images={cabin.images} alt={cabin.name} className="w-full h-full rounded-xl" />
                        {cabin.popular && (
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[var(--color-navy-900)] text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest shadow-sm z-10">
                            Signature Suites
                          </div>
                        )}
                      </div>

                      {/* Content - Editorial style */}
                      <div className={`flex flex-col justify-center flex-1 transition-colors duration-500 rounded-xl ${isSelected ? 'bg-[var(--color-surface-50)] -mx-4 px-4 md:mx-0 md:px-6 py-4' : 'py-2'}`}>
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h3 className="text-2xl font-serif text-[var(--color-navy-900)] leading-tight">{cabin.name}</h3>
                          </div>
                          
                          {/* Availability Badge Minimalist */}
                          <div className="inline-flex items-center gap-1.5 mb-4">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFullyBooked ? 'bg-gray-400' : availability.isLow ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className="text-xs uppercase tracking-widest font-medium text-gray-500">
                              {availability.text}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
                            {cabin.desc}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mt-auto border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mb-1">Per Guest</p>
                            <p className="font-serif text-xl text-[var(--color-navy-900)]">
                              IDR {cabin.price}
                            </p>
                          </div>

                          <div className="w-full sm:w-auto">
                            {isFullyBooked ? (
                              <button 
                                onClick={() => openWaitlistModal(cabin.name)}
                                className="w-full sm:w-max px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[var(--color-navy-900)] text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2"
                              >
                                Waitlist
                              </button>
                            ) : (
                              <div className="flex items-center justify-between sm:justify-start gap-4">
                                <button 
                                  onClick={() => handleRemovePax(cabin.name)} disabled={paxInCabin === 0}
                                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full text-[var(--color-navy-900)] disabled:opacity-30 disabled:bg-gray-50 transition-all hover:border-[var(--color-navy-900)]"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-lg font-serif w-6 text-center text-[var(--color-navy-900)]">{paxInCabin}</span>
                                <button 
                                  onClick={() => handleAddPax(cabin.name, availability.availablePax)} disabled={paxInCabin >= availability.availablePax}
                                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full text-[var(--color-navy-900)] disabled:opacity-30 disabled:bg-gray-50 transition-all hover:border-[var(--color-navy-900)]"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky Cart (Editorial & Minimalist) */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="lg:sticky lg:top-28 pt-4">
              
              <div className="bg-white p-8 shadow-luxury border border-gray-200/50 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)]" />
                
                <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-6">Reservation Details</h2>

                <div className="mb-8">
                  <DatePicker 
                    label="Select Departure Date (Saturdays)" 
                    selectedDate={selectedDateObj} 
                    onSelect={handleDateSelect} 
                    filterDate={(date) => date.getDay() === 6}
                  />
                </div>

                <div className="bg-[var(--color-surface-50)] rounded-sm p-6 border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Guest Manifest
                  </h4>

                  <div className="space-y-4 min-h-[60px] mb-6">
                    <AnimatePresence mode="popLayout">
                      {Object.keys(selectedCabins).length === 0 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-light text-gray-400 italic">
                          No quarters selected.
                        </motion.p>
                      )}

                      {Object.entries(selectedCabins).map(([cabinName, count]) => {
                        const cabinData = cabins.find(c => c.name === cabinName);
                        const price = cabinData ? parsePrice(cabinData.price) : 0;
                        return (
                          <motion.div 
                            key={cabinName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                          >
                            <div>
                              <p className="font-serif text-[var(--color-navy-900)] font-medium text-sm">{cabinName}</p>
                              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{count} Guest{count > 1 ? 's' : ''}</p>
                            </div>
                            <span className="font-medium text-[var(--color-navy-900)] text-sm">{(count * price).toLocaleString('id-ID')}</span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-gray-200 pt-5">
                    <div className="flex justify-between items-end mb-1 text-xs text-gray-500 uppercase tracking-widest">
                      <span>Total Invoice</span>
                      <span className="font-bold text-[var(--color-navy-900)]">{totalPax} Pax</span>
                    </div>
                    <div className="text-3xl font-serif text-[var(--color-navy-900)] tracking-tight text-right flex items-baseline justify-end gap-1.5 mt-2">
                      <span className="text-sm font-sans text-gray-500 font-normal">IDR</span> 
                      {totalPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleProceedToCheckout} 
                  disabled={isSubmitting || totalPax === 0 || isFetchingData}
                  className="w-full mt-6 !py-4 text-sm uppercase tracking-widest rounded-sm"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Clearance</>}
                </Button>
                
                <div className="mt-6 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-400 font-light leading-relaxed">
                    Sailing credentials and passenger manifests are protected under strict maritime privacy encryptions.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 🚨 AUTH REQUIRED MODAL 🚨 */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Authentication Required">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-200">
            <Lock className="w-6 h-6 text-[var(--color-navy-800)]" />
          </div>
          <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Secure Your Quarters</h3>
          <p className="text-gray-500 font-light text-sm mb-8 px-4 leading-relaxed">
            To proceed with the clearance and ensure the security of your voyage manifest, please access your member account.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => setIsAuthModalOpen(false)} className="w-full !rounded-sm">
              Cancel
            </Button>
            <Button onClick={() => router.push('/login')} className="w-full !rounded-sm">
              Sign In
            </Button>
          </div>
        </div>
      </Modal>

      {/* WAITLIST MODAL */}
      <Modal isOpen={isWaitlistModalOpen} onClose={() => setIsWaitlistModalOpen(false)} title="Waitlist Request">
        {waitlistSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Priority Waitlist Secured</h3>
            <p className="text-gray-500 font-light text-sm mb-8 px-2 leading-relaxed">Your request for the <strong className="text-[var(--color-navy-900)]">{waitlistCabin}</strong> has been registered. Our concierge will contact you immediately upon availability.</p>
            <Button onClick={() => setIsWaitlistModalOpen(false)} className="w-full !rounded-sm">Close</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 font-light leading-relaxed">The <strong className="font-medium text-[var(--color-navy-900)]">{waitlistCabin}</strong> is currently reserved for <strong className="font-medium text-[var(--color-navy-900)]">{selectedDateObj ? selectedDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</strong>. Enter your details to join our priority waitlist.</p>
            <div className="space-y-4">
              <Input label="Lead Guest Name" value={waitlistForm.name} onChange={e => setWaitlistForm({...waitlistForm, name: e.target.value})} placeholder="e.g. James Bond" />
              <Input label="Email Address" type="email" value={waitlistForm.email} onChange={e => setWaitlistForm({...waitlistForm, email: e.target.value})} placeholder="james@example.com" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="WhatsApp (Optional)" type="tel" value={waitlistForm.phone} onChange={e => setWaitlistForm({...waitlistForm, phone: e.target.value})} placeholder="+62..." />
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1.5 text-gray-500">Total Guests</label>
                  <input type="number" min="1" max="10" value={waitlistForm.pax} onChange={e => setWaitlistForm({...waitlistForm, pax: parseInt(e.target.value)})} className="w-full p-3.5 bg-white rounded-sm border border-gray-200 outline-none focus:border-[var(--color-navy-800)] transition-all" />
                </div>
              </div>
            </div>
            <Button 
              onClick={submitWaitlist} 
              isLoading={isSubmittingWaitlist} 
              disabled={!waitlistForm.name || !waitlistForm.email}
              className="w-full mt-2 !rounded-sm"
            >
              Submit Request
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}