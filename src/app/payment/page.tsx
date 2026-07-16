"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, Ship, Loader2, Copy, CheckCircle2, 
  UploadCloud, Clock, Landmark, QrCode, ArrowRight, AlertTriangle, CircleDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  // State untuk Fitur Pembayaran Manual
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  
  // State Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // 1. Fetch Data Booking dari Firebase
  useEffect(() => {
    async function fetchBooking() {
      if (!orderId) {
        setErrorMessage("Order ID not found in the URL.");
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'bookings', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBookingData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorMessage("Booking invoice not found in our system.");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setErrorMessage("Secure connection failed. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [orderId]);

  // 2. Countdown Timer Logic (1x24 Jam dari waktu createdAt)
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
        
        // Format dengan leading zero
        setTimeLeft(
          `${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingData]);

  // 3. Fungsi Salin (Copy to Clipboard)
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // 4. Fungsi Upload Bukti Pembayaran via Secure API Backend
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', bookingData.id); // SUNTIKKAN ORDER ID KE BACKEND

    try {
      // Menembak ke API internal kita, BUKAN langsung ke Cloudinary
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      const uploadedUrl = data.url;

      // Update State Lokal agar UI berubah langsung menjadi Centang Hijau
      setBookingData((prev: any) => ({
        ...prev,
        status: 'WAITING_VERIFICATION',
        paymentProofUrl: uploadedUrl
      }));

    } catch (err: any) {
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ==================== RENDERERS ====================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold text-navy">Accessing Vault...</h2>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-navy mb-2">Invoice Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
          <button onClick={() => router.push('/')} className="w-full bg-navy text-white py-3 rounded-xl font-bold">Return Home</button>
        </div>
      </div>
    );
  }

  const { status, paymentMethod, totalAmount } = bookingData;

  // Nilai statis client ID fallback jika proses environment lambat terbaca di sisi klien
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col selection:bg-gold selection:text-navy">
      {/* Navbar Minimalis */}
      <nav className="bg-navy py-5 shadow-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ship className="w-6 h-6 text-gold" />
            <span className="text-lg font-extrabold tracking-widest text-white uppercase">
              PMM <span className="text-gold">Reserve</span>
            </span>
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            Secure Billing
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 mt-4 md:mt-8 pb-24">
        
        {/* SKENARIO 1: SUDAH BAYAR / SEDANG DIVERIFIKASI */}
        {(status === 'WAITING_VERIFICATION' || status === 'PAID') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-2xl mx-auto mt-10">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-20" />
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy mb-3">
              {status === 'PAID' ? 'Payment Successful!' : 'Verification in Progress'}
            </h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              {status === 'PAID' 
                ? "Your voyage is fully secured. We have sent your official E-Ticket to your email address." 
                : "We have received your payment proof. Our harbor master is currently verifying the transaction. You will receive the E-Ticket shortly."}
            </p>
            <button onClick={() => router.push('/dashboard')} className="bg-navy hover:bg-[#122643] text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mx-auto">
              Go to My Vault <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* SKENARIO 2: PENDING (BELUM BAYAR) */}
        {status === 'PENDING' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* KOLOM KIRI: INSTRUKSI PEMBAYARAN */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Box Countdown */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-navy text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-red-500/20 p-2.5 rounded-xl border border-red-500/30">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Complete Payment In</h2>
                    <p className="text-xs text-gray-400">Your reservation will be cancelled if unpaid.</p>
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-gold tracking-widest font-mono bg-black/20 p-4 rounded-2xl text-center border border-white/5 shadow-inner">
                  {timeLeft || "--h : --m : --s"}
                </div>
              </motion.div>

              {/* Box Detail Bank / QRIS / PAYPAL */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                
                {paymentMethod === 'MANUAL_BANK' && (
                  <>
                    <h3 className="text-sm font-extrabold text-navy uppercase tracking-widest flex items-center gap-2 mb-6 border-b pb-4">
                      <Landmark className="w-5 h-5 text-gold" /> Bank Transfer Details
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Bank Name</p>
                        <p className="text-lg font-extrabold text-navy">Bank Central Asia (BCA)</p>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                        <div className="overflow-hidden">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Account Number</p>
                          <p className="text-xl md:text-2xl font-extrabold font-mono text-navy tracking-widest truncate">040 123 4567</p>
                        </div>
                        <button onClick={() => handleCopy('0401234567', 'account')} className="bg-white p-3 rounded-xl border border-gray-200 hover:border-gold hover:text-gold transition-colors shadow-sm shrink-0">
                          {copiedText === 'account' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
                        </button>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Account Holder Name</p>
                        <p className="text-lg font-extrabold text-navy">PT. PMM Voyage Indonesia</p>
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === 'MANUAL_QRIS' && (
                  <div className="text-center">
                    <h3 className="text-sm font-extrabold text-navy uppercase tracking-widest flex items-center justify-center gap-2 mb-6 border-b pb-4">
                      <QrCode className="w-5 h-5 text-gold" /> Scan to Pay (QRIS)
                    </h3>
                    <div className="bg-gray-50 p-6 rounded-3xl inline-block border border-gray-200 shadow-inner mb-4">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QRIS PMM Voyage" className="w-48 h-48 md:w-56 md:h-56 object-contain" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Scan using GoPay, OVO, Dana, ShopeePay, or Mobile Banking.</p>
                  </div>
                )}

                {paymentMethod === 'PAYPAL' && (
                  <div className="text-center">
                    <h3 className="text-sm font-extrabold text-navy uppercase tracking-widest flex items-center justify-center gap-2 mb-6 border-b pb-4">
                      <CircleDollarSign className="w-5 h-5 text-gold" /> Pay with PayPal
                    </h3>
                    
                    {/* PAYPAL INTEGRATION BLOCK */}
                    <div className="px-4 md:px-10 mt-6 relative z-10">
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
                            setIsLoading(true); 
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

                              // Transaksi Sukses! Update UI seketika
                              setBookingData((prev: any) => ({ ...prev, status: 'PAID' }));
                            } catch (err: any) {
                              setErrorMessage(`PayPal Error: ${err.message}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          onError={(err) => {
                            console.error("PayPal Error:", err);
                            alert("PayPal window encountered an error. Please refresh and try again.");
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>

                    <p className="text-xs text-gray-500 font-medium mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      You will be securely redirected to PayPal. Your card details are encrypted and not stored on our servers.
                    </p>
                  </div>
                )}
              </motion.div>

            </div>

            {/* KOLOM KANAN: TOTAL TAGIHAN & FORM UPLOAD */}
            <div className="lg:col-span-5 space-y-6">
              
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gold/30 relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-24 h-24 text-gold" />
                </div>
                
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">Payment Summary</h3>
                
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                  <span className="text-sm font-bold text-gray-500">Booking ID</span>
                  <span className="font-mono text-xs font-bold text-navy bg-gray-100 px-2 py-1 rounded">{orderId}</span>
                </div>
                
                <div className="pt-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Transfer Amount</p>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-3xl md:text-4xl font-extrabold text-navy tracking-tighter">
                      <span className="text-lg text-gray-400 mr-1">IDR</span>
                      {totalAmount?.toLocaleString('id-ID')}
                    </p>
                    {paymentMethod !== 'PAYPAL' && (
                      <button onClick={() => handleCopy(totalAmount.toString(), 'amount')} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 hover:border-gold hover:text-gold transition-colors">
                        {copiedText === 'amount' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
                      </button>
                    )}
                  </div>
                  
                  {paymentMethod === 'PAYPAL' ? (
                     <div className="mt-4 bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-start gap-2">
                       <CircleDollarSign className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                         Converted to USD internally via PayPal secure exchange rate during checkout.
                       </p>
                     </div>
                  ) : (
                    <div className="mt-4 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                        Please transfer <strong className="underline">exactly</strong> the amount shown above to speed up the automated verification process.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* FORM UPLOAD (Hanya muncul jika bukan PayPal) */}
              {paymentMethod !== 'PAYPAL' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-extrabold text-navy mb-4 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-gold" /> Upload Payment Proof
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Once you have completed the transfer, please upload a screenshot or photo of the receipt here.
                  </p>

                  <AnimatePresence>
                    {uploadError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                        {uploadError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative h-32">
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
                      className={`flex flex-col items-center justify-center gap-3 h-full rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        isExpired ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' :
                        isUploading ? 'border-gold bg-gold/5 text-gold' : 
                        'border-gray-300 hover:border-gold hover:bg-gold/5 text-navy group'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin" /> 
                          <span className="text-xs font-bold">Uploading securely...</span>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
                            <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-gold" />
                          </div>
                          <span className="text-xs font-bold text-gray-500 group-hover:text-navy">Click to browse file</span>
                        </>
                      )}
                    </label>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-navy font-bold">Initializing Secure Connection...</div>}>
      <PaymentContent />
    </Suspense>
  );
}