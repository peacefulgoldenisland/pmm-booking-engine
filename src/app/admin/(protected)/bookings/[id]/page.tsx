"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, 
  CreditCard, User, Ship, Calendar, 
  MapPin, Phone, Mail, FileCheck, Loader2, Edit3, UploadCloud, Trash2
} from 'lucide-react';

import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { cn } from '@/lib/utils';
import { 
  AdminCard, 
  AdminCardHeader, 
  AdminCardContent 
} from '@/components/admin/ui/AdminCard';
import type { Booking, Passenger } from '@/types/booking';
import { logAuditTrail } from '@/lib/auditLogger';
import { useAuthStore } from '@/store/useAuthStore';

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

const NativeCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-sm border border-gray-200 p-4 md:p-6 shadow-sm mb-4 md:mb-6", className)}>
    {children}
  </div>
);

export default function BookingDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Rejection Form State
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Pax Inline Edit State
  const [editingPaxIndex, setEditingPaxIndex] = useState<number | null>(null);
  const [editPaxData, setEditPaxData] = useState<Passenger | null>(null);
  const [isUploadingPaxDoc, setIsUploadingPaxDoc] = useState(false);

  // Global Edit State
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [editGlobalData, setEditGlobalData] = useState<Partial<Booking>>({});
  const [cabins, setCabins] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const docRef = doc(db, 'bookings', params.id);
        const [docSnap, cabinSnap] = await Promise.all([
          getDoc(docRef),
          getDocs(collection(db, 'products'))
        ]);
        
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() } as Booking);
        }
        setCabins(cabinSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      setBooking((prev) => prev ? ({ ...prev, status: 'PAID', verifiedAt: new Date().toISOString() }) : prev);
      
      await logAuditTrail({
        action: 'VERIFY_PAYMENT',
        module: 'Bookings',
        targetId: params.id,
        details: `Verified payment for booking ${params.id}`,
        actor: currentUser
      });
      
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
      setBooking((prev) => prev ? ({ 
        ...prev, 
        status: 'PENDING', 
        paymentProofUrl: null,
        rejectReason: rejectReason
      }) : prev);
      setShowRejectForm(false);
      
      await logAuditTrail({
        action: 'REJECT_PAYMENT',
        module: 'Bookings',
        targetId: params.id,
        details: `Rejected payment for booking ${params.id}. Reason: ${rejectReason}`,
        actor: currentUser
      });

    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("Failed to reject payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editPaxData) return;

    setIsUploadingPaxDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      setEditPaxData({ ...editPaxData, passportFileUrl: data.url });
    } catch (err: any) {
      alert(`Failed to upload passport: ${err.message}`);
    } finally {
      setIsUploadingPaxDoc(false);
    }
  };

  const handleSavePax = async () => {
    if (editingPaxIndex === null || !editPaxData || !booking) return;

    setIsProcessing(true);
    try {
      const updatedManifest = [...booking.passengersManifest!];
      updatedManifest[editingPaxIndex] = editPaxData;

      const docRef = doc(db, 'bookings', params.id);
      await updateDoc(docRef, {
        passengersManifest: updatedManifest
      });

      setBooking({ ...booking, passengersManifest: updatedManifest });
      setEditingPaxIndex(null);
      setEditPaxData(null);
      
      await logAuditTrail({
        action: 'UPDATE_PASSENGER',
        module: 'Bookings',
        targetId: params.id,
        details: `Updated passenger manifest for booking ${params.id}`,
        actor: currentUser
      });

    } catch (error) {
      console.error("Error updating manifest:", error);
      alert("Failed to update passenger details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveGlobal = async () => {
    if (!booking) return;
    setIsProcessing(true);
    try {
      const docRef = doc(db, 'bookings', params.id);
      
      // Auto-calculate total amount based on base price and discount
      const finalBase = editGlobalData.basePrice ?? booking.basePrice;
      const finalDiscount = editGlobalData.discountAmount ?? booking.discountAmount;
      const finalTotal = Math.max(0, finalBase - finalDiscount);
      
      const payload = {
        ...editGlobalData,
        totalAmount: finalTotal
      };
      
      await updateDoc(docRef, payload);
      setBooking({ ...booking, ...payload });
      setIsEditingGlobal(false);
      
      await logAuditTrail({
        action: 'UPDATE_BOOKING_MASTER',
        module: 'Bookings',
        targetId: params.id,
        details: `Updated master data for booking ${params.id}`,
        actor: currentUser
      });

    } catch (error) {
      console.error("Error updating global booking data:", error);
      alert("Failed to update booking data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAdminBooking = async () => {
    if (!booking) return;
    if (booking.userId !== 'MANUAL_ENTRY_ADMIN') {
      alert("Only bookings created by Admin can be deleted.");
      return;
    }

    if (!confirm("Are you sure you want to completely delete this booking? This will restore the cabin quotas and cannot be undone.")) {
      return;
    }

    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Restore Quota
        const voyageId = typeof booking.voyageScheduleId === 'string' ? booking.voyageScheduleId : (typeof booking.dateOfDeparture === 'string' ? booking.dateOfDeparture : '');
        if (voyageId && booking.cart) {
          const voyageRef = doc(db, 'voyages', voyageId);
          const voyageDoc = await transaction.get(voyageRef);
          if (voyageDoc.exists()) {
            const voyageData = voyageDoc.data();
            const quotas = voyageData.cabinQuotas || {};
            
            for (const [cabinId, qty] of Object.entries(booking.cart)) {
              quotas[cabinId] = (quotas[cabinId] || 0) + (qty as number);
            }
            transaction.update(voyageRef, { cabinQuotas: quotas });
          }
        }
        
        // 2. Delete Booking
        const bookingRef = doc(db, 'bookings', params.id);
        transaction.delete(bookingRef);
      });

      alert("Booking successfully deleted and quota restored.");
      router.push('/admin/bookings');

    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking.");
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
            Return to Bookings
          </AdminButton>
        </AdminCardContent>
      </AdminCard>
    );
  }

  return (
    <div className="pb-32 md:pb-24">
      {/* Unified Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 sticky top-0 z-50 bg-[var(--color-surface-50)]/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 md:static md:bg-transparent md:p-0 md:mx-0 md:backdrop-blur-none border-b border-gray-200 md:border-none shadow-sm md:shadow-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-sm bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[var(--color-navy-900)] hover:border-[var(--color-gold-400)] transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-serif text-[var(--color-navy-900)] flex items-center gap-2 md:gap-3 flex-wrap">
              Reference: <span className="font-mono bg-white md:bg-[var(--color-surface-50)] px-2 md:px-3 py-1 rounded-sm border border-gray-200 text-sm md:text-2xl">{booking.bookingId}</span>
            </h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {isEditingGlobal ? (
            <>
              <AdminButton variant="outline" onClick={() => setIsEditingGlobal(false)} disabled={isProcessing}>
                Cancel
              </AdminButton>
              <AdminButton variant="success" onClick={handleSaveGlobal} isLoading={isProcessing}>
                Save
              </AdminButton>
            </>
          ) : (
            <>
              {booking.userId === 'MANUAL_ENTRY_ADMIN' && (
                <AdminButton variant="danger" onClick={handleDeleteAdminBooking} isLoading={isProcessing}>
                  <Trash2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Delete</span>
                </AdminButton>
              )}
              <AdminButton variant="outline" onClick={() => {
                setEditGlobalData(booking);
                setIsEditingGlobal(true);
              }}>
                <Edit3 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Edit Master Data</span>
              </AdminButton>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-8">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2">
          
          {/* General Info */}
          <NativeCard>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
              <Ship className="w-4 h-4 text-[var(--color-gold-500)]" /> Trip Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Status</p>
                {isEditingGlobal ? (
                  <AdminSelect 
                    value={editGlobalData.status || booking.status}
                    onChange={(val) => setEditGlobalData({...editGlobalData, status: val as any})}
                    options={[
                      { value: 'WAITING_VERIFICATION', label: 'Waiting Verification' },
                      { value: 'PAID', label: 'Paid / Approved' },
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'CANCELLED', label: 'Cancelled' }
                    ]}
                  />
                ) : (
                  <AdminBadge 
                    variant={
                      booking.status === 'PAID' ? 'success' :
                      booking.status === 'WAITING_VERIFICATION' ? 'warning' :
                      booking.status === 'PENDING' ? 'default' : 'danger'
                    }
                  >
                    {booking.status.replace('_', ' ')}
                  </AdminBadge>
                )}
              </div>
              
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Departure</p>
                {isEditingGlobal ? (
                  <AdminInput 
                    type="date"
                    value={
                      (editGlobalData.dateOfDeparture as string) || 
                      (typeof booking.dateOfDeparture === 'string' 
                        ? booking.dateOfDeparture 
                        : (booking.dateOfDeparture as any)?.toDate?.()?.toISOString().split('T')[0]) || 
                      ''
                    }
                    onChange={(e) => setEditGlobalData({...editGlobalData, dateOfDeparture: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-bold text-[var(--color-navy-900)] flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {booking.dateOfDeparture 
                      ? new Date(
                          typeof booking.dateOfDeparture === 'string' || typeof booking.dateOfDeparture === 'number' 
                            ? booking.dateOfDeparture 
                            : (booking.dateOfDeparture as any).toDate?.() || new Date()
                        ).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Cabin</p>
                {isEditingGlobal ? (
                  <AdminSelect 
                    value={editGlobalData.cabinClass || booking.cabinClass || ''}
                    onChange={(val) => setEditGlobalData({...editGlobalData, cabinClass: val as string})}
                    options={cabins.map(c => ({ value: c.name, label: c.name }))}
                  />
                ) : (
                  <p className="text-sm font-bold text-[var(--color-navy-900)]">{booking.cabinClass}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                {isEditingGlobal ? (
                  <AdminInput 
                    value={editGlobalData.pickupLocation || booking.pickupLocation || ''}
                    onChange={(e) => setEditGlobalData({...editGlobalData, pickupLocation: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2 truncate">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {booking.pickupLocation || 'Not Specified'}
                  </p>
                )}
              </div>
            </div>
          </NativeCard>

          {/* Passenger Manifest */}
          <NativeCard>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
              <User className="w-4 h-4 text-[var(--color-gold-500)]" /> Passenger Details ({booking.paxCount} Pax)
            </h3>
            <div className="space-y-4">
              {booking.passengersManifest?.map((pax: Passenger, idx: number) => (
                <div key={idx} className="bg-[var(--color-surface-50)] p-4 md:p-5 border border-gray-100 rounded-sm flex flex-col gap-4 transition-all">
                  {editingPaxIndex === idx ? (
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
                         <h4 className="text-sm font-bold text-[var(--color-navy-900)]">Edit Passenger {idx + 1}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormGroup label="Full Name">
                           <AdminInput value={editPaxData?.fullName || ''} onChange={(e) => setEditPaxData({...editPaxData!, fullName: e.target.value})} />
                         </FormGroup>
                         <FormGroup label="Gender">
                           <AdminSelect 
                             value={editPaxData?.gender || ''} 
                             onChange={(val) => setEditPaxData({...editPaxData!, gender: val})} 
                             options={[{value:'M', label:'M - Male'}, {value:'F', label:'F - Female'}]} 
                           />
                         </FormGroup>
                         <FormGroup label="Age">
                           <AdminInput type="number" value={editPaxData?.age || ''} onChange={(e) => setEditPaxData({...editPaxData!, age: Number(e.target.value)})} />
                         </FormGroup>
                         <FormGroup label="Nationality">
                           <AdminInput value={editPaxData?.nationality || ''} onChange={(e) => setEditPaxData({...editPaxData!, nationality: e.target.value})} />
                         </FormGroup>
                         <FormGroup label="Place of Birth">
                           <AdminInput value={(editPaxData?.placeOfBirth as string) || ''} onChange={(e) => setEditPaxData({...editPaxData!, placeOfBirth: e.target.value})} />
                         </FormGroup>
                         <FormGroup label="Date of Birth">
                           <AdminInput type="date" value={(editPaxData?.dateOfBirth as string) || ''} onChange={(e) => setEditPaxData({...editPaxData!, dateOfBirth: e.target.value})} />
                         </FormGroup>
                         <FormGroup label="Dietary Restrictions">
                           <AdminSelect 
                             value={(editPaxData?.dietaryRequirements as string) || 'None'} 
                             onChange={(val) => setEditPaxData({...editPaxData!, dietaryRequirements: val})} 
                             options={[
                               { value: 'None', label: 'None' },
                               { value: 'Vegetarian', label: 'Vegetarian' },
                               { value: 'Vegan', label: 'Vegan' },
                               { value: 'Halal', label: 'Halal' },
                               { value: 'Gluten-Free', label: 'Gluten-Free' }
                             ]} 
                           />
                         </FormGroup>
                         <FormGroup label="Passport Number">
                           <AdminInput value={editPaxData?.passportNumber || ''} onChange={(e) => setEditPaxData({...editPaxData!, passportNumber: e.target.value})} />
                         </FormGroup>
                         
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Passport Document</label>
                           {isUploadingPaxDoc ? (
                             <div className="text-xs text-[var(--color-gold-500)] flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 animate-spin"/> Uploading...</div>
                           ) : (
                             <div className="flex flex-wrap items-center gap-3 mt-1">
                                <input type="file" id={`admin-pax-upload-${idx}`} className="hidden" accept="image/*,.pdf" onChange={handlePaxFileUpload} />
                                <label htmlFor={`admin-pax-upload-${idx}`} className="cursor-pointer bg-white border border-gray-300 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-navy-900)] rounded-sm hover:border-[var(--color-gold-400)] transition-all flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center">
                                  <UploadCloud className="w-3 h-3"/> Upload Doc
                                </label>
                                {editPaxData?.passportFileUrl ? (
                                  <span className="text-xs text-green-600 font-bold flex items-center gap-1 w-full sm:w-auto"><CheckCircle2 className="w-3 h-3"/> Attached</span>
                                ) : (
                                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1 w-full sm:w-auto"><AlertCircle className="w-3 h-3"/> Missing</span>
                                )}
                             </div>
                           )}
                         </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-200">
                         <AdminButton variant="outline" size="sm" onClick={() => { setEditingPaxIndex(null); setEditPaxData(null); }} disabled={isProcessing}>Cancel</AdminButton>
                         <AdminButton variant="primary" size="sm" onClick={handleSavePax} isLoading={isProcessing}>Save Changes</AdminButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[var(--color-navy-900)] font-serif text-lg shrink-0 shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--color-navy-900)] truncate">{pax.fullName || 'No Name Provided'}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span className="font-medium text-gray-700">{pax.nationality || 'UNKNOWN'}</span> •
                            <span>{pax.gender || '?'}</span> •
                            <span>Age: {pax.age || '?'}</span>
                            <span className="w-full sm:w-auto hidden sm:inline"> • </span>
                            <span className="font-mono text-gray-400 w-full sm:w-auto">ID: {pax.passportNumber || 'NONE'}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 border-t border-gray-200 pt-3 md:border-none md:pt-0 mt-1 md:mt-0">
                        <button className="flex-1 md:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-sm text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-100 transition-colors bg-white shadow-sm" onClick={() => { setEditingPaxIndex(idx); setEditPaxData(pax); }}>
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        
                        {pax.passportFileUrl ? (
                          <a href={pax.passportFileUrl} target="_blank" rel="noreferrer" className="flex-1 md:flex-none justify-center inline-flex items-center gap-1.5 bg-green-50 px-3 py-2 border border-green-200 rounded-sm text-[10px] font-bold text-green-700 uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm">
                            <FileCheck className="w-3 h-3" /> Doc
                          </a>
                        ) : (
                          <span className="flex-1 md:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-sm text-[10px] font-bold text-red-400 uppercase tracking-widest bg-gray-50">
                            <AlertCircle className="w-3 h-3" /> No Doc
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </NativeCard>

          {/* Primary Contact */}
          <NativeCard>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
              <Mail className="w-4 h-4 text-[var(--color-gold-500)]" /> Primary Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center shrink-0 border border-gray-100 shadow-sm"><Mail className="w-4 h-4 text-gray-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  {isEditingGlobal ? (
                    <AdminInput 
                      value={editGlobalData.contactEmail || booking.contactEmail || ''}
                      onChange={(e) => setEditGlobalData({...editGlobalData, contactEmail: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium text-[var(--color-navy-900)] truncate">{booking.contactEmail}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 w-full border-t border-gray-100 pt-4 md:border-none md:pt-0">
                <div className="w-10 h-10 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center shrink-0 border border-gray-100 shadow-sm"><Phone className="w-4 h-4 text-gray-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Phone Number (WhatsApp)</p>
                  {isEditingGlobal ? (
                    <AdminInput 
                      value={editGlobalData.contactPhone || booking.contactPhone || ''}
                      onChange={(e) => setEditGlobalData({...editGlobalData, contactPhone: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium text-[var(--color-navy-900)] truncate">{booking.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>
          </NativeCard>

        </div>

        {/* Right Column (Financials & Verification) */}
        <div className="lg:col-span-1">
          
          {/* Financial Summary */}
          <NativeCard className="bg-[var(--color-navy-900)] border-none shadow-luxury text-white">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold-400)] flex items-center gap-2 pb-4 border-b border-white/10 mb-6">
              <CreditCard className="w-4 h-4" /> Remittance Overview
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                <div className="flex flex-col">
                  <span className="text-gray-300 font-light">Base Price (Total)</span>
                  <span className="text-[10px] text-gray-500">
                    IDR {((booking.basePrice || 0) / (booking.paxCount || 1)).toLocaleString('id-ID')} / pax
                  </span>
                </div>
                {isEditingGlobal ? (
                  <div className="w-32">
                    <AdminInput 
                      type="number"
                      className="!bg-white/10 !border-white/20 !text-white"
                      value={editGlobalData.basePrice ?? booking.basePrice ?? 0}
                      onChange={(e) => setEditGlobalData({...editGlobalData, basePrice: Number(e.target.value)})}
                    />
                  </div>
                ) : (
                  <span className="font-mono text-base">IDR {booking.basePrice?.toLocaleString('id-ID')}</span>
                )}
              </div>
              {(booking.discountAmount > 0 || isEditingGlobal) && (
                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4 text-red-400">
                  <div className="flex flex-col">
                    <span className="font-light">Discount Applied</span>
                    {booking.discountAmount > 0 && (
                      <span className="text-[10px] text-red-500/70">
                        IDR {((booking.discountAmount || 0) / (booking.paxCount || 1)).toLocaleString('id-ID')} / pax
                      </span>
                    )}
                  </div>
                  {isEditingGlobal ? (
                    <div className="w-32">
                      <AdminInput 
                        type="number"
                        className="!bg-white/10 !border-red-400/30 !text-red-300"
                        value={editGlobalData.discountAmount ?? booking.discountAmount ?? 0}
                        onChange={(e) => setEditGlobalData({...editGlobalData, discountAmount: Number(e.target.value)})}
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-base">- IDR {booking.discountAmount?.toLocaleString('id-ID')}</span>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-gray-300 font-light text-sm">Payment Method</span>
                {isEditingGlobal ? (
                  <div className="w-40">
                    <AdminSelect 
                      className="!bg-white/10 !border-white/20 !text-white"
                      value={editGlobalData.paymentMethod || booking.paymentMethod}
                      onChange={(val) => setEditGlobalData({...editGlobalData, paymentMethod: val as any})}
                      options={[
                        { value: 'DIRECT_TRANSFER', label: 'Direct Transfer' },
                        { value: 'PAY_LATER', label: 'Pay Later / Chat' },
                        { value: 'CASH', label: 'Cash' }
                      ]}
                    />
                  </div>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-white/10 border border-white/20 px-2.5 py-1 rounded-sm text-[var(--color-gold-400)]">
                    {booking.paymentMethod?.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total Expected</p>
              <p className="text-3xl font-serif tracking-wide text-[var(--color-gold-400)]">
                <span className="text-sm font-sans text-gray-400 mr-1">IDR</span>
                {isEditingGlobal 
                  ? Math.max(0, (editGlobalData.basePrice ?? booking.basePrice ?? 0) - (editGlobalData.discountAmount ?? booking.discountAmount ?? 0)).toLocaleString('id-ID')
                  : booking.totalAmount?.toLocaleString('id-ID')
                }
              </p>
            </div>
          </NativeCard>

          {/* ACTION PANEL: Verification */}
          {booking.status === 'WAITING_VERIFICATION' && (
            <NativeCard className="border-l-[4px] border-l-amber-500 bg-gradient-to-br from-amber-50 to-white md:rounded-r-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-navy-900)] flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Action Required
              </h3>
              <p className="text-xs text-gray-600 font-medium mb-6">Guest has requested verification. Please verify manually.</p>

              {booking.paymentProofUrl ? (
                <div className="mb-6 rounded-sm overflow-hidden border border-gray-200 shadow-sm group relative cursor-pointer" onClick={() => booking.paymentProofUrl && window.open(booking.paymentProofUrl, '_blank')}>
                  <img src={booking.paymentProofUrl} alt="Payment Proof" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/50 bg-black/30 px-4 py-2 rounded-full backdrop-blur-md">View Receipt</span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-6 bg-white rounded-sm border border-dashed border-gray-300 text-center text-xs text-gray-400 uppercase tracking-widest font-bold">
                  <span className="block mb-2 text-2xl">📄</span>
                  No Proof Document Attached
                </div>
              )}

              {!showRejectForm ? (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleApprove} 
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-widest rounded-sm shadow-md transition-colors active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Approve Booking
                  </button>
                  <button 
                    onClick={() => setShowRejectForm(true)} 
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center py-4 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs uppercase tracking-widest rounded-sm shadow-sm transition-colors active:scale-95"
                  >
                    Reject Submission
                  </button>
                </div>
              ) : (
                <div className="bg-white p-5 border border-red-100 shadow-sm rounded-sm mt-4">
                  <label className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-3 block">Reason for Rejection</label>
                  <textarea 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-sm p-4 border border-red-200 rounded-sm bg-red-50/50 mb-4 outline-none focus:border-red-400 focus:bg-white transition-colors min-h-[100px]"
                    placeholder="e.g., Transfer amount does not match, image is blurry..."
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectForm(false)} disabled={isProcessing} className="flex-1 bg-white text-gray-500 py-3 rounded-sm border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleReject} disabled={isProcessing} className="flex-1 bg-red-600 text-white py-3 rounded-sm shadow-md text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">
                      {isProcessing ? 'Processing...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}
            </NativeCard>
          )}

          {/* Post Verification Status Info */}
          {booking.status === 'PAID' && (
             <NativeCard className="bg-green-50 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                   <CheckCircle2 className="w-6 h-6 text-green-600" />
                   <p className="text-sm font-bold text-green-800 uppercase tracking-widest">Booking Approved</p>
                </div>
                <p className="text-xs text-green-700 ml-9">The booking and payment have been verified successfully.</p>
             </NativeCard>
          )}

        </div>

      </div>

      {/* Mobile Sticky Action Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {isEditingGlobal ? (
          <>
            <button className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-widest rounded-sm transition-colors active:bg-gray-200" onClick={() => setIsEditingGlobal(false)} disabled={isProcessing}>
              Cancel
            </button>
            <button className="flex-[2] py-3 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] font-bold text-[10px] uppercase tracking-widest rounded-sm shadow-md transition-transform active:scale-95" onClick={handleSaveGlobal} disabled={isProcessing}>
              Save Master Data
            </button>
          </>
        ) : (
          <>
            {booking.userId === 'MANUAL_ENTRY_ADMIN' && (
              <button className="w-12 shrink-0 py-3 bg-red-50 text-red-600 border border-red-100 flex items-center justify-center rounded-sm transition-colors active:bg-red-100" onClick={handleDeleteAdminBooking} disabled={isProcessing}>
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button className="flex-1 py-3 bg-[var(--color-navy-900)] text-white font-bold text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest rounded-sm shadow-md transition-transform active:scale-95" onClick={() => {
              setEditGlobalData(booking);
              setIsEditingGlobal(true);
            }}>
              <Edit3 className="w-4 h-4" /> Edit Master Data
            </button>
          </>
        )}
      </div>

    </div>
  );
}
