import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';

interface InvoiceSummaryCardProps {
  orderId: string;
  totalAmount: number;
  paymentMethod: string;
}

export function InvoiceSummaryCard({ orderId, totalAmount, paymentMethod }: InvoiceSummaryCardProps) {
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
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
            {paymentMethod === 'DIRECT_TRANSFER' && (
              <button 
                onClick={() => handleCopy(totalAmount.toString(), 'amount')} 
                className="bg-[var(--color-surface-50)] px-4 py-3 border border-gray-200 hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-600)] transition-colors shrink-0 outline-none flex justify-center items-center rounded-sm w-full xl:w-auto"
              >
                {copiedText === 'amount' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
              </button>
            )}
          </div>
          
          {paymentMethod === 'PAY_LATER' ? (
             <div className="flex items-start gap-4 bg-[var(--color-surface-50)] p-5 border border-gray-100 rounded-sm">
               <CircleDollarSign className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
               <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                 Please contact our team via WhatsApp to proceed with your payment.
               </p>
             </div>
          ) : (
            <div className="flex items-start gap-4 bg-red-50/50 p-5 border border-red-100 rounded-sm">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-800 font-medium leading-relaxed">
                Please transfer the exact amount shown. Different amounts will delay your payment verification.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
