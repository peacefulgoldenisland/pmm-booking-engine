"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, orderBy } from 'firebase/firestore';
import { 
  ArrowLeft, UserCircle, Mail, Phone, Calendar, 
  Sparkles, History, PlusCircle, MinusCircle, 
  Loader2, ShieldCheck, CheckCircle2 
} from 'lucide-react';

import { AdminCard, AdminCardHeader, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import type { GuestProfile } from '@/types/user';
import type { Booking } from '@/types/booking';

export default function GuestDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Point Manager State
  const [pointAmount, setPointAmount] = useState<number | ''>('');
  const [pointReason, setPointReason] = useState('');
  const [isProcessingPoints, setIsProcessingPoints] = useState(false);
  const [pointOperation, setPointOperation] = useState<'ADD' | 'DEDUCT'>('ADD');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Guest Data
        const userRef = doc(db, 'users', params.id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setGuest({ id: userSnap.id, ...userSnap.data() } as GuestProfile);
        } else {
          setIsLoading(false);
          return;
        }

        // Fetch Booking History
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('userId', '==', params.id));
        const bookingsSnap = await getDocs(q);
        
        // Sorting manually since querying with where + orderBy requires a composite index
        const history = bookingsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Booking))
          .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
          
        setBookingHistory(history);
      } catch (error) {
        console.error("Error fetching guest details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const handleUpdatePoints = async () => {
    if (!pointAmount || typeof pointAmount !== 'number' || pointAmount <= 0) {
      alert("Please enter a valid point amount.");
      return;
    }
    if (!pointReason.trim()) {
      alert("Please provide a reason for this point adjustment.");
      return;
    }

    setIsProcessingPoints(true);
    try {
      const userRef = doc(db, 'users', params.id);
      const currentBalance = guest?.pointsBalance || 0;
      
      let newBalance = currentBalance;
      if (pointOperation === 'ADD') {
        newBalance += pointAmount;
      } else {
        newBalance = Math.max(0, currentBalance - pointAmount);
      }

      await updateDoc(userRef, {
        pointsBalance: newBalance
      });

      // Update local state
      setGuest((prev) => prev ? ({ ...prev, pointsBalance: newBalance }) : prev);
      
      // Reset form
      setPointAmount('');
      setPointReason('');
      alert(`Successfully ${pointOperation === 'ADD' ? 'added' : 'deducted'} points.`);

    } catch (error) {
      console.error("Error updating points:", error);
      alert("Failed to update points.");
    } finally {
      setIsProcessingPoints(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)]" />
      </div>
    );
  }

  if (!guest) {
    return (
      <AdminCard className="max-w-md mx-auto mt-10">
        <AdminCardContent className="p-12 text-center pt-12">
          <p className="text-gray-500 mb-6">Guest record not found.</p>
          <AdminButton variant="outline" onClick={() => router.back()}>
            Return to Registry
          </AdminButton>
        </AdminCardContent>
      </AdminCard>
    );
  }

  return (
    <div className="pb-24">
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[var(--color-navy-900)] hover:border-[var(--color-gold-400)] transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)] flex items-center gap-3">
            Guest Profile 
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile & Point Manager */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Identity Card */}
          <AdminCard className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-[var(--color-navy-900)]" />
            
            <AdminCardContent className="pt-8">
              <div className="w-24 h-24 bg-white rounded-full mx-auto relative z-10 border-4 border-white shadow-md flex items-center justify-center mb-4">
                <UserCircle className="w-16 h-16 text-gray-300" />
              </div>
              
              <h2 className="text-2xl font-serif text-[var(--color-navy-900)]">{guest.fullName || 'Unnamed Guest'}</h2>
              <div className="mt-2">
                <AdminBadge variant={guest.role === 'admin' ? 'brand' : 'outline'}>
                  {guest.role || 'user'}
                </AdminBadge>
              </div>

              <div className="mt-8 space-y-4 text-left border-t border-gray-100 pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center"><Mail className="w-4 h-4 text-gray-500" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Email</p>
                    <p className="text-sm font-medium text-[var(--color-navy-900)]">{guest.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center"><Phone className="w-4 h-4 text-gray-500" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-medium text-[var(--color-navy-900)]">{guest.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center"><Calendar className="w-4 h-4 text-gray-500" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Member Since</p>
                    <p className="text-sm font-medium text-[var(--color-navy-900)]">
                      {guest.createdAt 
                        ? new Date(
                            typeof guest.createdAt === 'string' || typeof guest.createdAt === 'number' 
                              ? guest.createdAt 
                              : (guest.createdAt as any).toDate?.() || new Date()
                          ).toLocaleDateString('id-ID') 
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* Loyalty Point Manager */}
          <AdminCard className="bg-[var(--color-navy-900)] border-[var(--color-gold-500)]/20 shadow-luxury">
            <AdminCardHeader className="border-b-0 pb-0">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-400)] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Loyalty Point Manager
              </h3>
            </AdminCardHeader>
            <AdminCardContent className="text-white pt-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-sm text-center mb-8">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                <p className="text-4xl font-mono text-white tracking-wider flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-[var(--color-gold-500)]" />
                  {guest.pointsBalance?.toLocaleString('id-ID') || 0}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Manual Adjustment</p>
                
                <div className="flex gap-2 mb-2">
                  <AdminButton 
                    variant={pointOperation === 'ADD' ? 'gold' : 'outline'}
                    onClick={() => setPointOperation('ADD')}
                    className="flex-1 py-2 h-auto text-[10px] !bg-transparent border-white/10 text-white data-[active=true]:!bg-[var(--color-gold-500)] data-[active=true]:text-[var(--color-navy-900)] data-[active=true]:border-[var(--color-gold-500)]"
                    data-active={pointOperation === 'ADD'}
                  >
                    <PlusCircle className="w-3 h-3 mr-2" /> Grant
                  </AdminButton>
                  <AdminButton 
                    variant={pointOperation === 'DEDUCT' ? 'danger' : 'outline'}
                    onClick={() => setPointOperation('DEDUCT')}
                    className="flex-1 py-2 h-auto text-[10px] !bg-transparent border-white/10 text-white data-[active=true]:!bg-red-600 data-[active=true]:text-white data-[active=true]:border-red-600"
                    data-active={pointOperation === 'DEDUCT'}
                  >
                    <MinusCircle className="w-3 h-3 mr-2" /> Deduct
                  </AdminButton>
                </div>

                <div>
                  <AdminInput 
                    leftIcon={<Sparkles className="w-4 h-4 text-gray-400" />}
                    type="number" 
                    value={pointAmount}
                    onChange={(e) => setPointAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter point amount..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-[var(--color-gold-400)] focus-visible:ring-[var(--color-gold-400)]/20"
                  />
                </div>

                <textarea 
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  placeholder="Reason (e.g. Service recovery, Special promotion)"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-sm py-3 px-4 text-sm text-white placeholder:text-gray-500 focus:border-[var(--color-gold-400)] outline-none resize-none focus:ring-2 focus:ring-[var(--color-gold-400)]/20"
                />

                <AdminButton 
                  onClick={handleUpdatePoints} 
                  isLoading={isProcessingPoints}
                  variant={pointOperation === 'ADD' ? 'gold' : 'danger'}
                  className="w-full"
                >
                  Execute Adjustment
                </AdminButton>
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>

        {/* RIGHT COLUMN: Booking History */}
        <div className="xl:col-span-2 space-y-8">
          <AdminCard className="h-full">
            <AdminCardHeader>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--color-navy-900)]" /> Voyage History ({bookingHistory.length})
              </h3>
            </AdminCardHeader>
            <AdminCardContent>
              {bookingHistory.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-gray-200 rounded-sm bg-[var(--color-surface-50)]">
                  <p className="text-gray-500 text-sm">This guest has no prior sailing history.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-sm p-5 hover:border-[var(--color-gold-300)] transition-colors group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                        <div>
                          <p className="font-mono text-sm font-bold text-[var(--color-navy-900)]">{booking.bookingId}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                            Booked on: {booking.createdAt 
                              ? new Date(
                                  typeof booking.createdAt === 'string' || typeof booking.createdAt === 'number' 
                                    ? booking.createdAt 
                                    : (booking.createdAt as any).toDate?.() || new Date()
                                ).toLocaleDateString('id-ID') 
                              : '-'}
                          </p>
                        </div>
                        
                        <AdminBadge 
                          variant={
                            booking.status === 'PAID' ? 'success' :
                            booking.status === 'WAITING_VERIFICATION' ? 'warning' :
                            booking.status === 'PENDING' ? 'default' : 'danger'
                          }
                          className="gap-1"
                        >
                          {booking.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {booking.status.replace('_', ' ')}
                        </AdminBadge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Departure</p>
                          <p className="text-xs font-bold text-[var(--color-navy-900)]">
                            {booking.dateOfDeparture 
                              ? new Date(
                                  typeof booking.dateOfDeparture === 'string' || typeof booking.dateOfDeparture === 'number' 
                                    ? booking.dateOfDeparture 
                                    : (booking.dateOfDeparture as any).toDate?.() || new Date()
                                ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Quarters</p>
                          <p className="text-xs font-bold text-[var(--color-navy-900)]">{booking.cabinClass}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Guests</p>
                          <p className="text-xs font-bold text-[var(--color-navy-900)]">{booking.paxCount} Pax</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Invoice</p>
                          <p className="text-sm font-serif text-[var(--color-navy-900)]">
                            IDR {booking.totalAmount?.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                        <button 
                          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                          className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold-600)] hover:text-[var(--color-navy-900)] transition-colors flex items-center gap-1"
                        >
                          View Full Details &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCardContent>
          </AdminCard>
        </div>

      </div>
    </div>
  );
}
