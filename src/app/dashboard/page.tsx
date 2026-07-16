"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Calendar, MapPin, Users, Ticket, 
  ChevronRight, Loader2, ChevronDown, User,
  Compass, Shield, Plus, Anchor, PlaneTakeoff, 
  Wine, ShoppingBag, ConciergeBell, History, 
  ArrowRight, ExternalLink, CreditCard, Clock
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import Image from 'next/image';
import { ReviewManager } from '@/components/dashboard/ReviewManager';

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
  
  // Arsitektur Tab Baru
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'services'>('upcoming');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

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

        // Urutkan tiket: yang terdekat/terbaru di atas
        fetchedBookings.sort((a, b) => new Date(b.dateOfDeparture).getTime() - new Date(a.dateOfDeparture).getTime());
        setBookings(fetchedBookings);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Pemisah Tiket Masa Depan & Masa Lalu
  // Tiket yang belum PAID akan selalu masuk 'upcoming' agar tamu bisa segera membayarnya
  const upcomingBookings = bookings.filter(b => new Date(b.dateOfDeparture) >= new Date() || b.status !== 'PAID');
  const pastBookings = bookings.filter(b => new Date(b.dateOfDeparture) < new Date() && b.status === 'PAID');

  const getDayAndMonth = (dateString: string) => {
    if (!dateString) return { day: '-', month: '-' };
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

  // Helper UI Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">CONFIRMED</span>;
      case 'WAITING_VERIFICATION':
        return <span className="px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-yellow-50 text-yellow-600 border border-yellow-100">VERIFYING</span>;
      case 'PENDING':
        return <span className="px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">UNPAID</span>;
      default:
        return <span className="px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mb-4" />
        <h2 className="text-lg font-bold text-navy animate-pulse">Decrypting your vault...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-24 selection:bg-gold selection:text-navy pt-24">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
        
        {/* ======================================================== */}
        {/* COMPACT & ELEGANT PROFILE BANNER (HORIZONTAL)            */}
        {/* ======================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-navy rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden text-white border border-navy/20 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gold to-[#b8972e] p-[2px] shadow-lg shrink-0">
              <div className="w-full h-full rounded-full bg-navy flex items-center justify-center overflow-hidden">
                {userProfile?.photoUrl ? (
                  <Image src={userProfile.photoUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gold">{userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-gold" />}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gold text-[10px] font-extrabold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> PMM Reserve Member
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white truncate max-w-[250px] md:max-w-[400px]">
                {greeting}, {userProfile?.fullName?.split(' ')[0] || 'Explorer'}
              </h2>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto relative z-10">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4 flex-1 md:w-48">
              <div className="bg-gold/20 p-2.5 rounded-full"><Award className="w-5 h-5 text-gold" /></div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Gold Points</p>
                <p className="text-2xl font-extrabold text-white leading-none mt-0.5">{userProfile?.pointsBalance || 0}</p>
              </div>
            </div>
            <button onClick={() => router.push('/')} className="hidden md:flex bg-gold hover:bg-[#b8972e] text-navy px-6 py-4 rounded-2xl font-extrabold shadow-lg shadow-gold/20 transition-all items-center gap-2">
              <Plus className="w-5 h-5" /> Book Voyage
            </button>
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* MODERN TAB NAVIGATION                                    */}
        {/* ======================================================== */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-max">
          <button 
            onClick={() => setActiveTab('upcoming')} 
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'upcoming' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Compass className="w-4 h-4" /> Upcoming Expeditions <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] ml-1">{upcomingBookings.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('past')} 
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'past' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <History className="w-4 h-4" /> Past Voyages
          </button>
          <button 
            onClick={() => setActiveTab('services')} 
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'services' ? 'bg-gold text-navy shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ConciergeBell className="w-4 h-4" /> VVIP Services
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB CONTENT AREA                                         */}
        {/* ======================================================== */}
        <AnimatePresence mode="wait">
          
          {/* --- TAB: UPCOMING & PAST BOOKINGS (COMPACT LIST VIEW) --- */}
          {(activeTab === 'upcoming' || activeTab === 'past') && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              
              {/* Data Kosong */}
              {((activeTab === 'upcoming' && upcomingBookings.length === 0) || (activeTab === 'past' && pastBookings.length === 0)) && (
                <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Anchor className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-extrabold text-navy mb-2">No {activeTab} voyages</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">You do not have any {activeTab} itineraries at the moment. Plan your next escape with us.</p>
                  {activeTab === 'upcoming' && (
                    <button onClick={() => router.push('/')} className="bg-navy hover:bg-[#122643] text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg">
                      Explore Destinations
                    </button>
                  )}
                </div>
              )}

              {/* Looping Tiket (Sleek Rows) */}
              {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => {
                const dateInfo = getDayAndMonth(booking.dateOfDeparture);
                const isExpanded = expandedBookingId === booking.id;

                return (
                  <div key={booking.id} className="bg-white rounded-[1.5rem] shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300">
                    
                    {/* BARIS UTAMA (COMPACT) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 cursor-pointer" onClick={() => toggleExpand(booking.id)}>
                      
                      {/* Tanggal & Rute */}
                      <div className="flex items-center gap-5 md:w-1/3 mb-4 md:mb-0">
                        <div className="bg-navy/5 border border-navy/10 rounded-xl w-16 h-16 flex flex-col items-center justify-center shrink-0">
                          <span className="text-gold text-xs font-extrabold uppercase tracking-widest leading-none">{dateInfo.month}</span>
                          <span className="text-navy text-2xl font-extrabold leading-tight">{dateInfo.day}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Route</p>
                          <p className="text-sm md:text-base font-extrabold text-navy flex items-center gap-2">
                            Lombok <ArrowRight className="w-3 h-3 text-gold" /> Komodo
                          </p>
                        </div>
                      </div>

                      {/* Info Kabin & Tamu */}
                      <div className="flex items-center gap-6 md:w-1/3 mb-4 md:mb-0 border-l-2 border-dashed border-gray-100 pl-0 md:pl-6">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cabin Class</p>
                          <p className="text-sm font-bold text-navy truncate max-w-[150px]">{booking.cabinClass}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Guests</p>
                          <p className="text-sm font-bold text-navy flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gold"/> {booking.paxCount} Pax</p>
                        </div>
                      </div>

                      {/* Status & Tombol Expand */}
                      <div className="flex items-center justify-between md:justify-end gap-4 md:w-1/3">
                        {getStatusBadge(booking.status)}
                        <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-navy text-white' : 'bg-gray-50 text-navy hover:bg-gold/20 hover:text-gold'}`}>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                    </div>

                    {/* AREA DETAIL YANG BISA DI-EXPAND */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100 bg-[#fdfbf7] overflow-hidden"
                        >
                          <div className="p-6 md:p-8">
                            
                            {/* --- CONDITIONAL ACTION BAR BERDASARKAN STATUS --- */}
                            <div className="flex flex-wrap gap-3 mb-8">
                              
                              {/* Jika PENDING: Minta user upload bukti atau bayar */}
                              {booking.status === 'PENDING' && (
                                <button 
                                  onClick={() => router.push(`/payment?order_id=${booking.id}`)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                                >
                                  <CreditCard className="w-4 h-4" /> Pay Now / Upload Proof
                                </button>
                              )}

                              {/* Jika WAITING_VERIFICATION: Tampilkan info sedang diverifikasi */}
                              {booking.status === 'WAITING_VERIFICATION' && (
                                <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm border border-yellow-200">
                                  <Clock className="w-4 h-4" /> Payment is being verified by Admin
                                </div>
                              )}

                              {/* Jika PAID: Baru bisa Download Tiket & Reschedule */}
                              {booking.status === 'PAID' && (
                                <>
                                  <button 
                                    onClick={() => window.open(`/ticket/${booking.id}`, '_blank')}
                                    className="bg-white border border-gray-200 hover:border-gold text-navy text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                                  >
                                    <Ticket className="w-4 h-4 text-gold" /> Download E-Ticket
                                  </button>
                                  
                                  {activeTab === 'upcoming' && (
                                    <button 
                                      onClick={() => router.push(`/dashboard/reschedule/${booking.id}`)} 
                                      className="bg-white border border-gray-200 hover:border-gold text-navy text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                                    >
                                      <Calendar className="w-4 h-4 text-gold" /> Request Reschedule
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              
                              {/* Kolom 1: Passenger Manifest */}
                              <div>
                                <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <User className="w-3 h-3" /> Detailed Manifest
                                </h4>
                                <div className="space-y-3">
                                  {booking.passengersManifest?.map((pax, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-extrabold text-navy flex items-center gap-2">
                                          {pax.fullName}
                                          {idx === 0 && <span className="bg-gold/20 text-gold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">Lead</span>}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                          {pax.nationality} • {pax.gender} • Passport: {pax.passportNumber}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Kolom 2: Voyage Journal / Review Manager (Hanya jika tiket sudah PAID) */}
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
              })}
            </motion.div>
          )}

          {/* --- TAB: VVIP SERVICES (COMING SOON FEATURES) --- */}
          {activeTab === 'services' && (
            <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-navy rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2000&auto=format&fit=crop")' }} />
                <div className="relative z-10 max-w-2xl">
                  <h2 className="text-3xl font-extrabold mb-2">Elevate Your Journey</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">Our concierge team is preparing exclusive additions to make your next voyage truly unforgettable. Stay tuned for these upcoming privileges.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Private Yacht Charter", desc: "Charter the entire phinisi exclusively for your family or corporate retreat.", icon: Anchor },
                  { title: "Helicopter Transfer", desc: "Skip the traffic. Direct VIP transfer from Bali Airport to the harbor.", icon: PlaneTakeoff },
                  { title: "In-Cabin Champagne", desc: "Pre-order Dom Pérignon to be chilled and waiting in your suite upon arrival.", icon: Wine },
                  { title: "Exclusive Merchandise", desc: "Premium PMM Reserve apparel, dive gear, and souvenirs delivered to your cabin.", icon: ShoppingBag },
                  { title: "Private Dive Master", desc: "Hire a dedicated 1-on-1 dive instructor for your entire Komodo expedition.", icon: Compass },
                ].map((service, idx) => {
                  const Icon = service.icon;
                  return (
                    <div key={idx} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
                      <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest group-hover:bg-gold group-hover:text-navy transition-colors">
                        Coming Soon
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-5 border border-gray-100 group-hover:border-gold/30 group-hover:bg-gold/5 transition-colors">
                        <Icon className="w-6 h-6 text-navy group-hover:text-gold transition-colors" />
                      </div>
                      <h3 className="text-lg font-extrabold text-navy mb-2">{service.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{service.desc}</p>
                      <button className="text-[10px] font-bold text-navy uppercase tracking-widest flex items-center gap-1 group-hover:text-gold transition-colors">
                        Explore Options <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      
      {/* Tombol Book Mobile */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button onClick={() => router.push('/')} className="w-14 h-14 bg-gold text-navy rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
          <Plus className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}