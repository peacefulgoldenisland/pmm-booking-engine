"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Calendar, Users, Ticket, 
  ChevronDown, User, Compass, Shield, Plus, Anchor, PlaneTakeoff, 
  Wine, ShoppingBag, ConciergeBell, History, 
  ArrowRight, ExternalLink, CreditCard, Clock
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { ReviewManager } from '@/components/dashboard/ReviewManager';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';

interface Booking {
  id: string;
  dateOfDeparture: string;
  cabinClass: string;
  paxCount: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  passengersManifest: any[];
}

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserProfile({ uid: user.uid, email: user.email, ...userDocSnap.data() });
        } else {
          setUserProfile({ uid: user.uid, email: user.email, pointsBalance: 0 });
        }

        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('userId', '==', user.uid));
        
        const querySnapshot = await getDocs(q);
        const fetchedBookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
        });

        fetchedBookings.sort((a, b) => new Date(b.dateOfDeparture).getTime() - new Date(a.dateOfDeparture).getTime());
        setBookings(fetchedBookings);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 500); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  const upcomingBookings = bookings.filter(b => new Date(b.dateOfDeparture) >= new Date() || b.status !== 'PAID');
  const pastBookings = bookings.filter(b => new Date(b.dateOfDeparture) < new Date() && b.status === 'PAID');

  const getDayAndMonth = (dateString: string) => {
    if (!dateString) return { day: '-', month: '-', year: '-' };
    const d = new Date(dateString);
    return {
      day: d.toLocaleDateString('en-US', { day: '2-digit' }),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.toLocaleDateString('en-US', { year: 'numeric' })
    };
  };

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 shadow-sm">Secured</span>;
      case 'WAITING_VERIFICATION':
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">Verifying</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 shadow-sm">Action Req</span>;
      default:
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[var(--color-surface-50)] text-gray-500 border border-gray-200 shadow-sm">{status}</span>;
    }
  };

  const renderBookingList = (bookingList: Booking[], emptyTitle: string, emptyDesc: string, showExploreBtn: boolean) => {
    if (bookingList.length === 0) {
      return (
        <div className="bg-white rounded-sm p-16 text-center border border-gray-200/60 shadow-sm">
          <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
            <Anchor className="w-6 h-6 text-gray-300" />
          </div>
          <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">{emptyTitle}</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">{emptyDesc}</p>
          {showExploreBtn && (
            <Button onClick={() => router.push('/')} variant="outline" className="!rounded-sm mx-auto uppercase tracking-widest text-xs">
              Explore Destinations
            </Button>
          )}
        </div>
      );
    }

    return bookingList.map((booking) => {
      const dateInfo = getDayAndMonth(booking.dateOfDeparture);
      const isExpanded = expandedBookingId === booking.id;

      return (
        <div key={booking.id} className="bg-white rounded-sm shadow-sm hover:shadow-luxury border border-gray-200/60 overflow-hidden transition-all duration-300 mb-5 relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-navy-900)]" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 cursor-pointer pl-8 md:pl-10" onClick={() => toggleExpand(booking.id)}>
            <div className="flex items-center gap-6 md:w-5/12 mb-6 md:mb-0">
              <div className="bg-[var(--color-surface-50)] border border-gray-200 rounded-sm w-16 h-16 flex flex-col items-center justify-center shrink-0 group-hover:border-[var(--color-gold-300)] transition-colors">
                <span className="text-[var(--color-gold-600)] text-[10px] font-bold uppercase tracking-widest leading-none">{dateInfo.month}</span>
                <span className="text-[var(--color-navy-900)] text-2xl font-serif leading-tight mt-1">{dateInfo.day}</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Itinerary</p>
                <p className="text-lg md:text-xl font-serif text-[var(--color-navy-900)] flex items-center gap-2">
                  Lombok <ArrowRight className="w-4 h-4 text-[var(--color-gold-500)]" /> Komodo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 md:w-4/12 mb-6 md:mb-0 md:border-l border-gray-100 md:pl-8">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Assigned Quarters</p>
                <p className="text-sm font-medium text-[var(--color-navy-900)] truncate max-w-[150px]">{booking.cabinClass}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Party Size</p>
                <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400"/> {booking.paxCount} Pax
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 md:w-3/12">
              {getStatusBadge(booking.status)}
              <div className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all border ${isExpanded ? 'bg-[var(--color-navy-900)] border-[var(--color-navy-900)] text-white' : 'bg-transparent border-gray-200 text-gray-400 group-hover:border-[var(--color-navy-900)] group-hover:text-[var(--color-navy-900)]'}`}>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100 bg-[var(--color-surface-50)] overflow-hidden"
              >
                <div className="p-6 md:p-10 pl-8 md:pl-10">
                  
                  {/* Action Banners */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    {booking.status === 'PENDING' && (
                      <Button onClick={() => router.push(`/payment?order_id=${booking.id}`)} variant="primary" className="!rounded-sm !py-2.5 !px-6 !text-[10px] uppercase tracking-widest !bg-red-600 hover:!bg-red-700 !shadow-none flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Remit Payment
                      </Button>
                    )}
                    {booking.status === 'WAITING_VERIFICATION' && (
                      <div className="bg-amber-50/50 text-amber-700 text-xs font-medium px-6 py-2.5 rounded-sm flex items-center gap-2 border border-amber-200 shadow-sm">
                        <Clock className="w-4 h-4" /> Harbor Master is authenticating transaction
                      </div>
                    )}
                    {booking.status === 'PAID' && (
                      <>
                        <Button onClick={() => window.open(`/ticket/${booking.id}`, '_blank')} variant="outline" className="!rounded-sm !py-2.5 !px-6 !text-[10px] uppercase tracking-widest flex items-center gap-2">
                          <Ticket className="w-4 h-4" /> Retrieve Manifest
                        </Button>
                        {new Date(booking.dateOfDeparture) >= new Date() && (
                          <Button onClick={() => router.push(`/dashboard/reschedule/${booking.id}`)} variant="outline" className="!rounded-sm !py-2.5 !px-6 !text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Modify Dates
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-[9px] font-bold text-[var(--color-gold-600)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <User className="w-3.5 h-3.5" /> Registered Guests
                      </h4>
                      <div className="space-y-3">
                        {booking.passengersManifest?.map((pax, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-sm border border-gray-200 flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-sm font-serif text-[var(--color-navy-900)] flex items-center gap-2">
                                {pax.fullName}
                                {idx === 0 && <span className="bg-[var(--color-gold-500)] text-[var(--color-navy-900)] text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Principal</span>}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                {pax.nationality} • {pax.gender} • ID: {pax.passportNumber}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {booking.status === 'PAID' && (
                      <div>
                        <ReviewManager booking={booking} userProfile={userProfile} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
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
                <p className="text-3xl font-serif text-white leading-none tracking-tight">{userProfile?.pointsBalance || 0}</p>
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
          <span className="bg-[var(--color-surface-50)] border border-gray-200 text-gray-500 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">{upcomingBookings.length} Trips</span>
        </div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
          {renderBookingList(upcomingBookings, "No upcoming voyages", "Your manifest is currently empty. Curate your next grand maritime escape with us today.", true)}
        </motion.div>

      </main>

      {/* ======================================================== */}
      {/* MODALS (PENGGANTI HALAMAN/TAB)                           */}
      {/* ======================================================== */}

      {/* MODAL 1: PAST VOYAGES */}
      <Modal isOpen={isPastModalOpen} onClose={() => setIsPastModalOpen(false)} title="Historical Logs" maxWidth="3xl">
        <div className="space-y-0 pt-2">
          {renderBookingList(pastBookings, "Vault Empty", "Your historical maritime logs will appear here once you complete a journey.", false)}
        </div>
      </Modal>

      {/* MODAL 2: VVIP SERVICES */}
      <Modal isOpen={isServicesModalOpen} onClose={() => setIsServicesModalOpen(false)} title="Concierge Offerings" maxWidth="3xl">
        <div className="space-y-8 pt-2">
          <div className="bg-[var(--color-navy-900)] rounded-sm p-8 text-white relative overflow-hidden border border-[var(--color-gold-500)]/20 shadow-luxury">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2000&auto=format&fit=crop")' }} />
            <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--color-gold-500)]/20 rounded-bl-full blur-xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-serif mb-2 text-[var(--color-gold-400)]">Elevate Your Journey</h2>
              <p className="text-gray-300 text-sm font-light leading-relaxed max-w-lg">Our master concierge is preparing exclusive bespoke additions for your upcoming voyages. Stay tuned.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: "Private Yacht Charter", desc: "Commandeer the entire phinisi exclusively.", icon: Anchor },
              { title: "Helicopter Transfer", desc: "Direct VIP flight to the departure harbor.", icon: PlaneTakeoff },
              { title: "In-Cabin Champagne", desc: "Dom Pérignon chilled upon your arrival.", icon: Wine },
              { title: "Private Dive Master", desc: "Dedicated 1-on-1 underwater instructor.", icon: Compass },
            ].map((service, idx) => {
              const Icon = service.icon;
              return (
                <div key={idx} className="bg-[var(--color-surface-50)] p-6 rounded-sm border border-gray-200 relative overflow-hidden group hover:border-[var(--color-gold-300)] transition-colors">
                  <div className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">
                    Soon
                  </div>
                  <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center mb-5 border border-gray-200 group-hover:border-[var(--color-gold-300)] shadow-sm transition-colors">
                    <Icon className="w-5 h-5 text-[var(--color-navy-800)] group-hover:text-[var(--color-gold-600)] transition-colors" />
                  </div>
                  <h3 className="text-lg font-serif text-[var(--color-navy-900)] mb-1.5">{service.title}</h3>
                  <p className="text-xs text-gray-500 font-light">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button onClick={() => router.push('/')} className="w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-full flex items-center justify-center shadow-luxury border-2 border-white focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:ring-offset-2">
          <Plus className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}