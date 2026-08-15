"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, Ship, Loader2, Copy, CheckCircle2, 
  UploadCloud, Clock, Landmark, QrCode, ArrowRight, 
  AlertTriangle, CircleDollarSign, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 1. AUTH GUARD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login'); 
        return;
      }
      setTimeout(() => setIsAuthChecking(false), 500); 
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Fetch Booking Data
  useEffect(() => {
    async function fetchBooking() {
      if (isAuthChecking) return; 

      if (!orderId) {
        setErrorMessage("Transaction reference missing from URL.");
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'bookings', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBookingData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorMessage("Invoice documentation could not be retrieved from our secure vault.");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setErrorMessage("Secure connection interrupted. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [orderId, isAuthChecking]);

  // 3. Countdown Timer (1x24 Hours)
  useEffect(() => {
    if (!bookingData || !bookingData.createdAt || bookingData.status !== 'PENDING') return;

    const expiryTime = new Date(bookingData.createdAt).getTime() + (24 * 60 * 60 * 1000);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('EXPIRED');
        clearInterval(interval);
      } else {
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingData]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // 4. Secure Upload via Backend API R2
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', bookingData.id); 

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      setBookingData((prev: any) => ({
        ...prev,
        status: 'WAITING_VERIFICATION',
        paymentProofUrl: data.url
      }));

    } catch (err: any) {
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isAuthChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] font-sans">
        <header className="bg-white border-b border-gray-200 py-5 px-6"><Skeleton className="w-48 h-6" /></header>
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
          <Skeleton className="w-full h-32 rounded-sm mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             <div className="lg:col-span-7"><Skeleton className="w-full h-[500px] rounded-sm" /></div>
             <div className="lg:col-span-5"><Skeleton className="w-full h-[400px] rounded-sm" /></div>
          </div>
        </main>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-sm border border-gray-200 shadow-luxury text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Invoice Unavailable</h2>
          <p className="text-gray-500 text-xs font-light leading-relaxed mb-8">{errorMessage}</p>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full !rounded-sm !py-3 uppercase tracking-widest text-xs">
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const { status, paymentMethod, totalAmount } = bookingData;
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col font-sans pb-24">
      
      {/* FULL WIDTH EDITORIAL HEADER */}
      <header className="bg-white border-b border-gray-200 pt-6 pb-5 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button onClick={() => router.back()} className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Modification Portal
          </button>
          
          <div className="flex items-center gap-3 md:gap-6 self-center">
            <div className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <div className="w-5 h-5 rounded-full bg-[var(--color-navy-900)] text-white flex items-center justify-center font-bold text-[10px]">1</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Manifest</span>
            </div>
            <div className="w-8 md:w-16 h-px bg-[var(--color-navy-900)]" />
            <div className="flex items-center gap-2 text-[var(--color-gold-600)]">
              <div className="w-5 h-5 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center font-bold text-[10px]">2</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Remittance</span>
            </div>
            <div className="w-8 md:w-16 h-px bg-gray-300" />
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center font-bold text-[10px]">3</div>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Clearance</span>
            </div>
          </div>
          <div className="hidden md:block w-40" />
        </div>
      </header>

      {/* OPTIMIZED WIDE CONTAINER MAX-W-7XL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 mt-10 md:mt-12">
        
        {/* ========================================================= */}
        {/* SCENARIO 1: ALREADY PAID OR WAITING FOR VERIFICATION      */}
        {/* ========================================================= */}
        {(status === 'WAITING_VERIFICATION' || status === 'PAID') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 md:p-20 rounded-sm shadow-luxury border border-gray-200/50 text-center max-w-3xl mx-auto mt-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--color-gold-500)]" />
            <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none">
                <ShieldCheck className="w-96 h-96 text-[var(--color-navy-900)]" />
            </div>
            
            <div className="w-28 h-28 bg-green-50/50 rounded-full flex items-center justify-center mx-auto mb-10 relative border border-green-100">
              {status === 'WAITING_VERIFICATION' && <div className="absolute inset-0 border-[3px] border-green-400 rounded-full animate-ping opacity-20" />}
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-navy-900)] mb-4">
              {status === 'PAID' ? 'Authorization Secured' : 'Verifying Remittance'}
            </h1>
            
            <p className="text-gray-500 text-sm font-light mb-12 leading-relaxed max-w-lg mx-auto">
              {status === 'PAID' 
                ? "Your maritime expedition is fully secured. We have dispatched your official digital manifest to your registered email address. Prepare for an unforgettable journey." 
                : "Your proof of remittance has been vaulted securely. The harbor master is executing manual verification. Your boarding documents will be issued momentarily."}
            </p>
            
            <Button onClick={() => router.push('/dashboard')} variant="primary" className="!rounded-sm !py-4 !px-10 uppercase tracking-widest text-xs mx-auto flex items-center gap-3">
              Return to Member Vault <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCENARIO 2: PENDING PAYMENT                               */}
        {/* ========================================================= */}
        {status === 'PENDING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN (7 Grids): INSTRUCTIONS & UPLOAD */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              {/* WIDE Horizontal Countdown Banner */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-navy-900)] text-white p-8 md:p-10 rounded-sm shadow-luxury relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-[var(--color-gold-500)]/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[var(--color-gold-500)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold-500)]">Secure Window Active</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif text-white mb-2 leading-tight">Complete Authorization</h2>
                  <p className="text-xs text-gray-400 font-light max-w-xs leading-relaxed">This itinerary will expire automatically upon countdown termination.</p>
                </div>
                
                <div className="relative z-10 text-4xl md:text-5xl font-serif text-white tracking-wider bg-white/5 border border-white/10 px-8 py-5 rounded-sm shadow-inner text-center shrink-0">
                  {timeLeft || "00:00:00"}
                </div>
              </motion.div>

              {/* Payment Details Box (Desktop Optimized Grid) */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 md:p-12 rounded-sm shadow-sm border border-gray-200/60">
                
                {paymentMethod === 'MANUAL_BANK' && (
                  <>
                    <h3 className="text-xl font-serif text-[var(--color-navy-900)] flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                      <Landmark className="w-5 h-5 text-[var(--color-gold-500)]" /> Wire Transfer Credentials
                    </h3>
                    
                    {/* BENTO GRID FOR BANK DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[var(--color-surface-50)] p-6 border border-gray-100 rounded-sm hover:border-[var(--color-gold-300)] transition-colors">
                        <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">Receiving Institution</p>
                        <p className="text-lg font-serif text-[var(--color-navy-900)]">Bank Central Asia (BCA)</p>
                      </div>

                      <div className="bg-[var(--color-surface-50)] p-6 border border-gray-100 rounded-sm hover:border-[var(--color-gold-300)] transition-colors">
                        <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">Account Beneficiary</p>
                        <p className="text-lg font-serif text-[var(--color-navy-900)] truncate">PT. PMM Voyage Indonesia</p>
                      </div>

                      <div className="md:col-span-2 bg-[var(--color-surface-50)] p-6 md:p-8 border border-gray-100 rounded-sm hover:border-[var(--color-gold-300)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="overflow-hidden">
                          <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">Destination Account Number</p>
                          <p className="text-3xl md:text-4xl font-mono font-bold text-[var(--color-navy-900)] tracking-widest truncate">040 123 4567</p>
                        </div>
                        <Button 
                          onClick={() => handleCopy('0401234567', 'account')} 
                          variant="outline"
                          className="shrink-0 !py-3 !px-6"
                        >
                          {copiedText === 'account' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Copied</> : <><Copy className="w-4 h-4 mr-2" /> Copy Number</>}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === 'MANUAL_QRIS' && (
                  <div className="text-center">
                    <h3 className="text-xl font-serif text-[var(--color-navy-900)] flex items-center justify-center gap-3 mb-8 pb-4 border-b border-gray-100">
                      <QrCode className="w-5 h-5 text-[var(--color-gold-500)]" /> Scan to Authorize
                    </h3>
                    <div className="bg-[var(--color-surface-50)] p-10 inline-block border border-gray-200 mb-6 rounded-sm shadow-inner">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QRIS PMM Voyage" className="w-56 h-56 md:w-64 md:h-64 object-contain mix-blend-multiply" />
                    </div>
                    <p className="text-sm text-gray-500 font-light leading-relaxed max-w-md mx-auto">Utilize any integrated e-wallet application (GoPay, OVO, Dana) or Mobile Banking platform to scan this code.</p>
                  </div>
                )}

                {paymentMethod === 'PAYPAL' && (
                  <div className="text-center">
                    <h3 className="text-xl font-serif text-[var(--color-navy-900)] flex items-center justify-center gap-3 mb-8 pb-4 border-b border-gray-100">
                      <CircleDollarSign className="w-5 h-5 text-[var(--color-gold-500)]" /> International Gateway
                    </h3>
                    
                    <div className="max-w-md mx-auto mt-8 relative z-10">
                      <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD", intent: "capture" }}>
                        <PayPalButtons
                          style={{ layout: "vertical", shape: "rect", color: "gold" }}
                          createOrder={async () => {
                            const res = await fetch('/api/paypal/create-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderId: bookingData.id })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Failed to create PayPal order');
                            return data.id; 
                          }}
                          onApprove={async (data, actions) => {
                            try {
                              const res = await fetch('/api/paypal/capture-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  paypalOrderId: data.orderID,
                                  pmmOrderId: bookingData.id
                                })
                              });
                              const captureData = await res.json();
                              if (!res.ok) throw new Error(captureData.error || 'Failed to capture payment');
                              setBookingData((prev: any) => ({ ...prev, status: 'PAID' }));
                            } catch (err: any) {
                              setErrorMessage(`PayPal Error: ${err.message}`);
                            }
                          }}
                          onError={(err) => {
                            console.error("PayPal Error:", err);
                            alert("PayPal window encountered an error. Please refresh and try again.");
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>

                    <p className="text-xs text-gray-500 font-light mt-10 bg-[var(--color-surface-50)] p-5 border border-gray-100 flex items-start gap-3 text-left rounded-sm">
                      <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      You will be securely redirected to PayPal's encrypted environment. Credit card credentials are never stored on our servers.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* UPLOAD PROOF AREA (WIDE LAYOUT) */}
              {paymentMethod !== 'PAYPAL' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 md:p-12 border border-gray-200/60 shadow-sm rounded-sm">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="md:w-1/2">
                        <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">
                            Submit Documentation
                        </h3>
                        <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">
                            Upon completing the remittance, please upload your transaction receipt. This initiates our automated harbor clearance verification protocol.
                        </p>
                        <AnimatePresence>
                            {uploadError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 p-4 border border-red-100 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {uploadError}
                            </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="md:w-1/2 relative h-48 md:h-56">
                        <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={handleUploadProof}
                            disabled={isUploading || isExpired}
                            className="hidden" 
                            id="proof-upload" 
                        />
                        <label 
                            htmlFor="proof-upload" 
                            className={`flex flex-col items-center justify-center gap-4 h-full w-full border-2 border-dashed cursor-pointer transition-all rounded-sm ${
                            isExpired ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' :
                            isUploading ? 'border-[var(--color-gold-500)] bg-[var(--color-gold-50)] text-[var(--color-gold-600)]' : 
                            'border-gray-300 hover:border-[var(--color-navy-800)] bg-[var(--color-surface-50)] hover:bg-white text-[var(--color-navy-900)] group'
                            }`}
                        >
                            {isUploading ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin" /> 
                                <span className="text-[10px] uppercase font-bold tracking-widest">Encrypting Transfer...</span>
                            </>
                            ) : (
                            <>
                                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-navy-800)] transition-colors" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-center mb-1.5">Select Receipt File</p>
                                    <p className="text-[10px] text-gray-400 font-light">JPG, PNG, PDF up to 5MB</p>
                                </div>
                            </>
                            )}
                        </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* RIGHT COLUMN (5 Grids): PAYMENT SUMMARY WIDGET */}
            <div className="lg:col-span-5 space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 md:p-12 shadow-luxury border border-gray-200/50 relative lg:sticky lg:top-32 rounded-sm overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold-500)]/5 pointer-events-none rounded-bl-full" />
                
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Invoice Summary</h3>
                
                <div className="flex justify-between items-center pb-6 border-b border-gray-100 mb-8">
                  <span className="text-base font-serif text-[var(--color-navy-900)]">Reference No.</span>
                  <span className="font-mono text-xs font-bold text-[var(--color-navy-900)] tracking-widest bg-[var(--color-surface-50)] px-3 py-1.5 border border-gray-200 rounded-sm">{orderId}</span>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">Total Amount Due</p>
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100 pb-8 mb-6">
                    <p className="text-4xl md:text-5xl font-serif text-[var(--color-navy-900)] tracking-tight">
                      <span className="text-lg font-sans text-gray-400 font-normal mr-2">IDR</span>
                      {totalAmount?.toLocaleString('id-ID')}
                    </p>
                    {paymentMethod !== 'PAYPAL' && (
                      <button 
                        onClick={() => handleCopy(totalAmount.toString(), 'amount')} 
                        className="bg-[var(--color-surface-50)] px-4 py-3 border border-gray-200 hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-600)] transition-colors shrink-0 outline-none flex justify-center items-center rounded-sm w-full xl:w-auto"
                      >
                        {copiedText === 'amount' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                      </button>
                    )}
                  </div>
                  
                  {paymentMethod === 'PAYPAL' ? (
                     <div className="flex items-start gap-4 bg-[var(--color-surface-50)] p-5 border border-gray-100 rounded-sm">
                       <CircleDollarSign className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                       <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                         Converted to USD dynamically via PayPal secure exchange rate during checkout window.
                       </p>
                     </div>
                  ) : (
                    <div className="flex items-start gap-4 bg-red-50/50 p-5 border border-red-100 rounded-sm">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-800 font-medium leading-relaxed">
                        Exact nominal transfer is strictly required. Any discrepancy will delay the automated harbor clearance verification.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-serif text-2xl text-[var(--color-navy-900)]"><Loader2 className="w-10 h-10 animate-spin text-[var(--color-gold-500)] mb-4"/> Establishing Secure Gateway...</div>}>
      <PaymentContent />
    </Suspense>
  );
}