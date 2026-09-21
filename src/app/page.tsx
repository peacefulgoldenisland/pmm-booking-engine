"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Users, ChevronRight, CheckCircle2, AlertCircle, Plus, Minus, Loader2, ArrowRight, Ship, X, LogOut, FileText, ChevronDown, Anchor, Calendar, DollarSign, Waves, Wind, UsersRound, ShieldCheck, Lock } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDocs } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { Skeleton } from '@/components/ui/Skeleton';
import Image from 'next/image';
import type { MasterCabin, VoyageSchedule } from '@/types/voyage';

export default function Home() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [cabins, setCabins] = useState<MasterCabin[]>([]);
  const [isFullyBooked, setIsFullyBooked] = useState(false);
  const [availableSeats, setAvailableSeats] = useState<Record<string, number> | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [selectedCabins, setSelectedCabins] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
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

  // Fetch Master Cabins
  useEffect(() => {
    const fetchCabins = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('price', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MasterCabin[];
        setCabins(data);
      } catch (error) {
        console.error("Error fetching cabins:", error);
      }
    };
    fetchCabins();
  }, []);

  // Set default date (next Saturday)
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

  // Fetch Availability for the selected date from API
  useEffect(() => {
    if (!selectedDateStr || cabins.length === 0) return;
    setIsFetchingData(true);
    setSelectedCabins({});
    
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/availability?date=${selectedDateStr}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSeats(data.availableSeats || {});
        } else {
          setAvailableSeats({});
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
        setAvailableSeats({});
      } finally {
        setTimeout(() => setIsFetchingData(false), 300);
      }
    };

    fetchAvailability();
    
  }, [selectedDateStr, cabins]);

  const getAvailabilityInfo = (cabinId: string, totalUnits: number) => {
    let available = totalUnits; // default if null
    
    if (availableSeats !== null) {
      available = availableSeats[cabinId] ?? 0;
    }
    
    if (available === 0) return { text: "Fully Booked", isLow: true, availableUnits: 0, totalUnits: totalUnits };
    if (available <= 5 && available < totalUnits) return { text: `Almost Sold Out - ${available} Left`, isLow: true, availableUnits: available, totalUnits: totalUnits };
    return { text: "Available", isLow: false, availableUnits: available, totalUnits: totalUnits };
  };

  const handleAddPax = (cabinId: string, availablePax: number) => {
    setSelectedCabins(prev => {
      const current = prev[cabinId] || 0;
      if (current >= availablePax) return prev; 
      return { ...prev, [cabinId]: current + 1 };
    });
  };

  const handleRemovePax = (cabinId: string) => {
    setSelectedCabins(prev => {
      const current = prev[cabinId] || 0;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[cabinId]; 
        return newState;
      }
      return { ...prev, [cabinId]: current - 1 };
    });
  };

  const totalPax = Object.values(selectedCabins).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(selectedCabins).reduce((total, [cabinId, count]) => {
    const cabinData = cabins.find(c => c.id === cabinId);
    return total + ((cabinData?.price || 0) * count);
  }, 0);

  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    const cartString = JSON.stringify(selectedCabins);
    const queryParams = new URLSearchParams({ 
      date: selectedDateStr, 
      cart: cartString, 
      pax: totalPax.toString() 
    });

    setTimeout(() => {
      router.push(`/checkout?${queryParams.toString()}`);
    }, 600);
  };

  const openWaitlistModal = (cabinId: string) => {
    const cabin = cabins.find(c => c.id === cabinId);
    setWaitlistCabin(cabin?.name || '');
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
    <div className="min-h-screen bg-[var(--color-surface-50)] pb-24">
      
      {isLoggedIn ? (
        <DashboardHeader />
      ) : (
        <nav className="sticky top-0 w-full z-50 bg-[var(--color-navy-900)] border-b border-white/10 py-4 shadow-md">
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image 
                src="/images/logo-light.png" 
                alt="PGI Reserve" 
                width={140} 
                height={40} 
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <button 
              onClick={() => router.push('/login')} 
              className="text-white hover:text-[var(--color-gold-500)] text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Log In
            </button>
          </div>
        </nav>
      )}

      {/* BOOKING ENGINE HEADER */}
      <div className={`bg-[var(--color-navy-900)] text-white ${isLoggedIn ? 'pt-28' : 'pt-8'} pb-16 px-4 md:px-6 relative z-10 border-b-4 border-[var(--color-gold-500)] transition-all`}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">Book Your Trip</h1>
          <p className="text-gray-400 font-light text-sm mb-6 max-w-xl leading-relaxed">Select your departure date and choose your cabin for the Komodo trip.</p>
          
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6 transform translate-y-12 border border-gray-100 max-w-3xl">
            <div className="w-full">
               <DatePicker 
                 label="Select Departure Date (Saturdays)" 
                 selectedDate={selectedDateObj} 
                 onSelect={handleDateSelect} 
                 filterDate={(date) => date.getDay() === 6}
               />
            </div>
            {isFetchingData && (
              <div className="flex items-center gap-2 text-[var(--color-gold-600)] font-bold text-[10px] uppercase tracking-widest animate-pulse w-full md:w-auto shrink-0 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking Quotas...
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-16 md:mt-20 relative z-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN - Cabin List */}
          <div className="lg:col-span-8 flex flex-col gap-4 pt-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-navy-900)] mb-2">Available Cabins</h2>

            <div className="grid grid-cols-1 gap-4">
              {isFetchingData || cabins.length === 0 ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={`skel-${i}`} className="bg-white rounded-xl flex flex-col md:flex-row h-[280px] md:h-[180px] border border-gray-200 overflow-hidden">
                    <Skeleton className="w-full md:w-48 h-48 md:h-full shrink-0" />
                    <div className="p-5 flex flex-col justify-center flex-1 space-y-4">
                      <Skeleton variant="text" className="w-3/4 h-6" />
                      <Skeleton variant="text" className="w-full h-3" />
                      <Skeleton variant="text" className="w-5/6 h-3" />
                    </div>
                  </div>
                ))
              ) : (
                cabins.map((cabin, idx) => {
                  const availability = getAvailabilityInfo(cabin.id, cabin.totalUnits || 0);
                  const paxInCabin = selectedCabins[cabin.id] || 0;
                  const isSelected = paxInCabin > 0;
                  const isFullyBooked = availability.availableUnits === 0;

                  return (
                    <motion.div 
                      key={cabin.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.4 }}
                      className={`bg-white rounded-xl border overflow-hidden flex flex-col sm:flex-row transition-all duration-300 shadow-sm hover:shadow-md ${isFullyBooked ? 'opacity-60 grayscale-[0.3]' : 'opacity-100'} ${isSelected ? 'border-[var(--color-navy-900)] ring-1 ring-[var(--color-navy-900)]' : 'border-gray-200'}`}
                    >
                      {/* Image */}
                      <div className="w-full sm:w-56 h-48 sm:h-auto relative shrink-0">
                        {cabin.images && cabin.images.length > 0 ? (
                           <ImageCarousel images={cabin.images} alt={cabin.name} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                        {cabin.popular && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[var(--color-navy-900)] text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-sm z-10">
                            Popular
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h3 className="text-lg md:text-xl font-serif text-[var(--color-navy-900)] font-bold leading-tight">{cabin.name}</h3>
                            <div className="text-right shrink-0">
                               <p className="font-serif text-lg text-[var(--color-navy-900)] whitespace-nowrap">IDR {Number(cabin.price).toLocaleString('id-ID')}</p>
                               <p className="text-[9px] text-gray-400 uppercase tracking-widest">Per Cabin</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-2 mb-3">
                            <UsersRound className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">Up to {cabin.maxCapacity} Pax / Unit</span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 mb-3">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFullyBooked ? 'bg-gray-400' : availability.isLow ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${availability.isLow ? 'text-red-500' : 'text-emerald-500'}`}>
                              {availability.text}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{cabin.description}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4">
                            <div className="flex gap-2">
                               {cabin.facilities?.slice(0,2).map((f, i) => (
                                 <span key={i} className="text-[9px] px-2 py-1 bg-gray-50 text-gray-500 rounded-sm truncate max-w-[100px] border border-gray-100">{f}</span>
                               ))}
                            </div>
                            
                            {isFullyBooked ? (
                              <button onClick={() => openWaitlistModal(cabin.id)} className="px-4 py-2 bg-[var(--color-navy-900)] hover:bg-[var(--color-navy-800)] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors shadow-sm">
                                Join Waitlist
                              </button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button onClick={() => handleRemovePax(cabin.id)} disabled={paxInCabin === 0} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-30 hover:border-[var(--color-navy-900)] hover:text-[var(--color-navy-900)] hover:bg-gray-50 transition-colors">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-bold text-sm w-4 text-center text-[var(--color-navy-900)]">{paxInCabin}</span>
                                <button onClick={() => handleAddPax(cabin.id, availability.availableUnits)} disabled={paxInCabin >= availability.availableUnits} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-30 hover:border-[var(--color-navy-900)] hover:text-[var(--color-navy-900)] hover:bg-gray-50 transition-colors">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky Cart */}
          <div className="lg:col-span-4 relative">
            <div className="lg:sticky lg:top-24 pt-4 lg:pt-11">
              
              <div className="bg-white p-6 shadow-luxury border border-[var(--color-gold-500)]/20 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)]" />
                
                <h2 className="text-xl font-serif text-[var(--color-navy-900)] mb-6 flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-[var(--color-gold-500)]" />
                   Booking Summary
                </h2>

                <div className="bg-[var(--color-surface-50)] rounded-lg p-5 border border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
                    Date: <span className="text-[var(--color-navy-900)]">{selectedDateObj ? selectedDateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                  </h4>

                  <div className="space-y-4 min-h-[60px] mb-4">
                    <AnimatePresence mode="popLayout">
                      {Object.keys(selectedCabins).length === 0 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-light text-gray-400 italic text-center py-4">
                          No cabins selected yet.
                        </motion.p>
                      )}

                      {Object.entries(selectedCabins).map(([cabinId, count]) => {
                        const cabinData = cabins.find(c => c.id === cabinId);
                        const price = cabinData?.price || 0;
                        return (
                          <motion.div 
                            key={cabinId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="pr-4">
                              <p className="font-serif text-[var(--color-navy-900)] font-medium text-sm leading-tight">{cabinData?.name || 'Cabin'}</p>
                              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{count} &times; Cabin</p>
                            </div>
                            <span className="font-medium text-[var(--color-navy-900)] text-sm whitespace-nowrap">{(count * price).toLocaleString('id-ID')}</span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-4 mt-2">
                    <div className="flex justify-between items-end mb-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      <span>Total Invoice</span>
                      <span className="text-[var(--color-navy-900)]">{totalPax} Cabins</span>
                    </div>
                    <div className="text-2xl font-serif text-[var(--color-navy-900)] tracking-tight text-right flex items-baseline justify-end gap-1 mt-1">
                      <span className="text-xs font-sans text-gray-500 font-normal">IDR</span> 
                      {totalPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleProceedToCheckout} 
                  disabled={isSubmitting || totalPax === 0 || isFetchingData}
                  className="w-full mt-6 !py-4 text-sm uppercase tracking-widest rounded-sm bg-[var(--color-navy-900)] hover:bg-[var(--color-navy-800)] text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Checkout</>}
                </Button>
                
                <div className="mt-5 flex items-start gap-2 bg-gray-50 p-3 rounded-sm border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 font-light leading-relaxed">
                    Secure 256-bit encrypted checkout. Your reservation is completely safe.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 🚨 AUTH REQUIRED MODAL 🚨 */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Log In to Continue">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-200">
            <Lock className="w-6 h-6 text-[var(--color-navy-800)]" />
          </div>
          <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Log In Required</h3>
          <p className="text-gray-500 font-light text-sm mb-8 px-4 leading-relaxed">
            Please log in to your account to continue your booking.
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
            <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Waitlist Request Sent</h3>
            <p className="text-gray-500 font-light text-sm mb-8 px-2 leading-relaxed">Your request for the <strong className="text-[var(--color-navy-900)]">{waitlistCabin}</strong> has been received. We will contact you when it's available.</p>
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