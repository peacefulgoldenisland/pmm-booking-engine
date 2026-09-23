import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Landmark, QrCode, 
  CheckCircle2, Copy, ShieldCheck, AlertTriangle, 
  UploadCloud, Loader2, MessageCircle, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Booking } from '@/types/booking';

interface PaymentInstructionsProps {
  bookingData: Booking;
  timeLeft: string;
  isExpired: boolean;
  setErrorMessage: (msg: string) => void;
}

export function PaymentInstructions({ bookingData, timeLeft, isExpired, setErrorMessage }: PaymentInstructionsProps) {
  const [copiedText, setCopiedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [isNotifying, setIsNotifying] = useState(false);

  const { paymentMethod } = bookingData;
  const adminWaNumber = "6287817865709";

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleNotifyAdmin = async () => {
    setIsNotifying(true);
    try {
      const docRef = doc(db, 'bookings', bookingData.id);
      await updateDoc(docRef, {
        status: 'WAITING_VERIFICATION'
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(`Failed to notify admin: ${error.message}`);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', bookingData.id); 

    try {
      // 1. Upload ke storage
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      // 2. Update Firestore Doc
      const docRef = doc(db, 'bookings', bookingData.id);
      await updateDoc(docRef, {
        status: 'WAITING_VERIFICATION',
        paymentProofUrl: data.url
      });
      // Karena parent menggunakan onSnapshot, halaman akan otomatis re-render!

    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col gap-8">
      
      {/* WIDE Horizontal Countdown Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-navy-900)] text-white p-8 md:p-10 rounded-sm shadow-luxury relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-[var(--color-gold-500)]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[var(--color-gold-500)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold-500)]">Time Remaining</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-2 leading-tight">Complete Your Payment</h2>
          <p className="text-xs text-gray-400 font-light max-w-xs leading-relaxed">Your booking will be cancelled automatically when the timer runs out.</p>
        </div>
        
        <div className="relative z-10 text-4xl md:text-5xl font-serif text-white tracking-wider bg-white/5 border border-white/10 px-8 py-5 rounded-sm shadow-inner text-center shrink-0">
          {timeLeft || "00:00:00"}
        </div>
      </motion.div>

      {/* Payment Details Box (Desktop Optimized Grid) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 md:p-12 rounded-sm shadow-sm border border-gray-200/60">
        
        {paymentMethod === 'DIRECT_TRANSFER' && (
          <>
            <h3 className="text-xl font-serif text-[var(--color-navy-900)] flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <Landmark className="w-5 h-5 text-[var(--color-gold-500)]" /> Bank Transfer Details
            </h3>
            
            {/* BENTO GRID FOR BANK DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-[var(--color-surface-50)] p-6 border border-gray-100 rounded-sm hover:border-[var(--color-gold-300)] transition-colors">
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">Bank Name</p>
                <p className="text-lg font-serif text-[var(--color-navy-900)]">Bank Central Asia (BCA)</p>
              </div>

              <div className="bg-[var(--color-surface-50)] p-6 border border-gray-100 rounded-sm hover:border-[var(--color-gold-300)] transition-colors">
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">Account Name</p>
                <p className="text-lg font-serif text-[var(--color-navy-900)] truncate">PT. PGI Voyage Indonesia</p>
              </div>

              <div className="md:col-span-2 bg-[var(--color-surface-50)] p-6 md:p-8 border border-gray-100 rounded-sm hover:border-[var(--color-gold-300)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="overflow-hidden">
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-2">Account Number</p>
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

            {/* QRIS SECTION (Merged into DIRECT_TRANSFER) */}
            <div className="text-center mb-12">
              <h3 className="text-sm font-serif text-[var(--color-navy-900)] flex items-center justify-center gap-3 mb-6">
                <QrCode className="w-4 h-4 text-[var(--color-gold-500)]" /> Pay via QRIS
              </h3>
              <div className="bg-[var(--color-surface-50)] p-6 inline-block border border-gray-200 mb-4 rounded-sm shadow-inner">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QRIS PGI Voyage" className="w-48 h-48 object-contain mix-blend-multiply" />
              </div>
              <p className="text-xs text-gray-500 font-light leading-relaxed max-w-sm mx-auto">Scan this code using any e-wallet app (GoPay, OVO, Dana, etc).</p>
            </div>
          </>
        )}

        {paymentMethod === 'PAY_LATER' && (
          <div className="text-center pb-8">
            <h3 className="text-xl font-serif text-[var(--color-navy-900)] flex items-center justify-center gap-3 mb-6">
              <MessageCircle className="w-5 h-5 text-[var(--color-gold-500)]" /> Contact Us to Pay
            </h3>
            <p className="text-sm text-gray-500 font-light max-w-md mx-auto leading-relaxed mb-8">
              Your booking is approved. Please contact our team via WhatsApp to coordinate your payment.
            </p>
            
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <a 
                href={`https://wa.me/${adminWaNumber}?text=Hello PGI Voyage, I would like to confirm my booking with Reference: ${bookingData.bookingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 py-4 px-6 rounded-sm font-bold text-[11px] uppercase tracking-widest transition-all"
              >
                <MessageCircle className="w-4 h-4" /> Open WhatsApp
                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
              </a>
              
              <div className="my-2 flex items-center gap-4">
                <div className="h-px bg-gray-100 flex-1"></div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">THEN</span>
                <div className="h-px bg-gray-100 flex-1"></div>
              </div>

              <Button 
                onClick={handleNotifyAdmin} 
                isLoading={isNotifying}
                variant="primary" 
                className="w-full !py-4 text-[11px] uppercase tracking-widest !bg-[var(--color-navy-900)] hover:!bg-[var(--color-navy-800)]"
              >
                I Have Contacted Admin
              </Button>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-6 max-w-sm mx-auto">
              Clicking the button above will pause the timer while our team reviews your booking.
            </p>
          </div>
        )}
      </motion.div>

      {/* UPLOAD PROOF AREA (Only for DIRECT_TRANSFER) */}
      {paymentMethod === 'DIRECT_TRANSFER' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 md:p-12 border border-gray-200/60 shadow-sm rounded-sm">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="md:w-1/2">
                <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">
                    Upload Payment Proof
                </h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">
                    After transferring the money, please upload your payment receipt here.
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
                        <span className="text-[10px] uppercase font-bold tracking-widest">Uploading...</span>
                    </>
                    ) : (
                    <>
                        <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-navy-800)] transition-colors" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-center mb-1.5">Upload Receipt</p>
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
  );
}
