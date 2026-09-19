import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import type { BookingStatus } from '@/types/booking';

interface PaymentSuccessStateProps {
  status: BookingStatus;
  paymentMethod?: string;
}

export function PaymentSuccessState({ status, paymentMethod }: PaymentSuccessStateProps) {
  const router = useRouter();
  
  return (
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
        {status === 'PAID' ? 'Payment Successful' : 'Verifying Payment'}
      </h1>
      
      <p className="text-gray-500 text-sm font-light mb-12 leading-relaxed max-w-lg mx-auto">
        {status === 'PAID' 
          ? "Your booking is confirmed! We have sent the ticket to your email. Get ready for an unforgettable journey." 
          : paymentMethod === 'PAY_LATER'
            ? "Your booking request has been submitted. Our team is reviewing it and will issue your ticket once confirmed."
            : "Your payment proof has been submitted securely. Our team is verifying it and will issue your ticket shortly."}
      </p>
      
      <Button onClick={() => router.push('/dashboard')} variant="primary" className="!rounded-sm !py-4 !px-10 uppercase tracking-widest text-xs mx-auto flex items-center gap-3">
        Back to Dashboard <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
