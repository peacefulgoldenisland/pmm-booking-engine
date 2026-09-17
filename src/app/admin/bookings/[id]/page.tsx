"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, 
  CreditCard, User, Ship, Calendar, 
  MapPin, Phone, Mail, FileCheck, Loader2
} from 'lucide-react';

import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardTitle, 
  AdminCardContent 
} from '@/components/admin/ui/AdminCard';

export default function BookingDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const docRef = doc(db, 'bookings', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooking();
  }, [params.id]);

  const handleApprove = async () => {
    if (!window.confirm("Approve this payment and secure the reservation?")) return;
    
    setIsProcessing(true);
    try {
      const docRef = doc(db, 'bookings', params.id);
      await updateDoc(docRef, {
        status: 'PAID',
        verifiedAt: new Date().toISOString()
      });
      setBooking((prev: any) => ({ ...prev, status: 'PAID' }));
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("Failed to approve payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setIsProcessing(true);
    try {
      const docRef = doc(db, 'bookings', params.id);
      await updateDoc(docRef, {
        status: 'PENDING',
        paymentProofUrl: null, // Clear the rejected proof
        rejectReason: rejectReason,
        rejectedAt: new Date().toISOString()
      });
      setBooking((prev: any) => ({ 
        ...prev, 
        status: 'PENDING', 
        paymentProofUrl: null,
        rejectReason: rejectReason
      }));
      setShowRejectForm(false);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("Failed to reject payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)]" />
      </div>
    );
  }

  if (!booking) {
    return (
      <AdminCard className="max-w-md mx-auto mt-10">
        <AdminCardContent className="p-12 text-center pt-12">
          <p className="text-gray-500 mb-6">Booking reference not found.</p>
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
            Reference: <span className="font-mono bg-[var(--color-surface-50)] px-3 py-1 rounded-sm border border-gray-200">{booking.bookingId}</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General Info */}
          <AdminCard>
            <AdminCardHeader>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Ship className="w-4 h-4 text-[var(--color-gold-500)]" /> Voyage Details
              </h3>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <AdminBadge 
                    variant={
                      booking.status === 'PAID' ? 'success' :
                      booking.status === 'WAITING_VERIFICATION' ? 'warning' :
                      booking.status === 'PENDING' ? 'default' : 'danger'
                    }
                  >
                    {booking.status.replace('_', ' ')}
                  </AdminBadge>
                </div>
                
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Departure</p>
                  <p className="text-sm font-bold text-[var(--color-navy-900)] flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {new Date(booking.dateOfDeparture).toLocaleDateString('id-ID')}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Quarters</p>
                  <p className="text-sm font-bold text-[var(--color-navy-900)]">{booking.cabinClass}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                  <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2 truncate">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {booking.pickupLocation || 'Not Specified'}
                  </p>
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* Passenger Manifest */}
          <AdminCard>
            <AdminCardHeader>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-gold-500)]" /> Passenger Manifest ({booking.paxCount} Pax)
              </h3>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="space-y-4">
                {booking.passengersManifest?.map((pax: any, idx: number) => (
                  <div key={idx} className="bg-[var(--color-surface-50)] p-5 border border-gray-100 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[var(--color-navy-900)] font-serif text-lg">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-navy-900)]">{pax.fullName}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{pax.nationality} • Age: {pax.age}</p>
                      </div>
                    </div>
                    
                    {pax.passportFileUrl ? (
                      <a href={pax.passportFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-sm text-[10px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest hover:border-[var(--color-gold-400)] transition-all">
                        <FileCheck className="w-4 h-4 text-green-600" /> View Passport
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-sm text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        No Doc Uploaded
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* Primary Contact */}
          <AdminCard>
            <AdminCardHeader>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--color-gold-500)]" /> Primary Contact
              </h3>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center"><Mail className="w-4 h-4 text-gray-500" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-medium text-[var(--color-navy-900)]">{booking.contactEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-gray-500" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-medium text-[var(--color-navy-900)]">{booking.contactPhone}</p>
                  </div>
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>

        </div>

        {/* Right Column (Financials & Verification) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Financial Summary */}
          <AdminCard className="bg-[var(--color-navy-900)] border-[var(--color-gold-500)]/20 shadow-luxury">
            <AdminCardHeader className="border-b border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-400)] flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Remittance Overview
              </h3>
            </AdminCardHeader>
            <AdminCardContent className="text-white pt-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                  <span className="text-gray-300 font-light">Base Price</span>
                  <span className="font-mono">IDR {booking.basePrice?.toLocaleString('id-ID')}</span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4 text-red-400">
                    <span className="font-light">Discount Applied</span>
                    <span className="font-mono">- IDR {booking.discountAmount?.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-gray-300 font-light text-sm">Payment Method</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-white/10 px-2 py-1 rounded-sm">
                    {booking.paymentMethod?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total Expected</p>
                <p className="text-3xl font-serif tracking-wide text-white">
                  <span className="text-sm font-sans text-gray-400 mr-1">IDR</span>
                  {booking.totalAmount?.toLocaleString('id-ID')}
                </p>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* ACTION PANEL: Verification */}
          {booking.status === 'WAITING_VERIFICATION' && booking.paymentMethod !== 'PAYPAL' && (
            <AdminCard className="border-2 border-amber-200">
              <AdminCardHeader>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-navy-900)] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Action Required
                </h3>
              </AdminCardHeader>
              <AdminCardContent>
                <p className="text-xs text-gray-500 font-light mb-6">Guest has submitted remittance documentation. Please verify the transfer.</p>

                {booking.paymentProofUrl ? (
                  <div className="mb-6 rounded-sm overflow-hidden border border-gray-200 shadow-inner group relative cursor-pointer" onClick={() => window.open(booking.paymentProofUrl, '_blank')}>
                    <img src={booking.paymentProofUrl} alt="Payment Proof" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold uppercase tracking-widest border border-white px-4 py-2 rounded-sm backdrop-blur-sm">View Full Screen</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-400 uppercase">
                    No Proof Document Attached
                  </div>
                )}

                {!showRejectForm ? (
                  <div className="flex flex-col gap-3">
                    <AdminButton 
                      variant="success"
                      onClick={handleApprove} 
                      isLoading={isProcessing}
                      className="w-full"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Clearance
                    </AdminButton>
                    <AdminButton 
                      variant="danger"
                      onClick={() => setShowRejectForm(true)} 
                      disabled={isProcessing}
                      className="w-full"
                    >
                      Reject Submission
                    </AdminButton>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 border border-red-100 rounded-sm mt-4">
                    <label className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-2 block">Reason for Rejection</label>
                    <textarea 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full text-sm p-3 border border-red-200 rounded-sm bg-white mb-4 outline-none focus:border-red-400"
                      placeholder="e.g., Transfer amount does not match, image is blurry..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-red-600 text-white py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">
                        {isProcessing ? 'Processing...' : 'Confirm Reject'}
                      </button>
                      <button onClick={() => setShowRejectForm(false)} disabled={isProcessing} className="flex-1 bg-white text-gray-500 py-2 rounded-sm border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </AdminCardContent>
            </AdminCard>
          )}

          {/* Post Verification Status Info */}
          {booking.status === 'PAID' && (
             <AdminCard className="bg-green-50 border-green-200">
                <AdminCardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-bold text-green-800 uppercase tracking-widest">Clearance Approved</p>
                  </div>
                  <p className="text-xs text-green-700">The reservation is secured. Guests have been authorized for boarding.</p>
                </AdminCardContent>
             </AdminCard>
          )}

        </div>

      </div>
    </div>
  );
}
