import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { UserReward } from '@/types/voucher';

interface MyVouchersProps {
  myVouchers: UserReward[];
  isLoadingData: boolean;
}

export function MyVouchers({ myVouchers, isLoadingData }: MyVouchersProps) {
  return (
    <motion.div key="vouchers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-4xl mx-auto">
      {isLoadingData ? (
         Array(3).fill(0).map((_, i) => (
           <Skeleton key={i} className="w-full h-32 rounded-sm shadow-sm" />
         ))
      ) : myVouchers.length === 0 ? (
        <div className="bg-white rounded-sm p-16 text-center border border-gray-200/50 shadow-sm">
          <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
            <Ticket className="w-6 h-6 text-gray-300" />
          </div>
          <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2">Vault Empty</h3>
          <p className="text-gray-500 font-light text-sm">You have not redeemed any privilege codes yet.</p>
        </div>
      ) : (
        myVouchers.map(v => (
          <div key={v.id} className={`bg-white rounded-sm p-6 md:p-8 border-l-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-luxury transition-shadow ${v.status === 'USED' ? 'border-l-gray-300 opacity-60' : 'border-l-[var(--color-gold-500)]'}`}>
            <div className="flex items-start md:items-center gap-5">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${v.status === 'USED' ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-[var(--color-surface-50)] border-[var(--color-gold-200)] text-[var(--color-gold-600)]'}`}>
                {v.status === 'USED' ? <Ticket className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-serif text-[var(--color-navy-900)] text-xl mb-1">{v.rewardName}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-light">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Authenticated</span>
                  <span className={`px-2 py-0.5 rounded-sm uppercase font-bold text-[9px] tracking-widest border ${v.status === 'USED' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {v.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--color-surface-50)] px-6 py-4 rounded-sm text-left md:text-right border border-gray-200 border-dashed shrink-0 w-full md:w-auto">
              <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Authorization Code</p>
              <p className="font-mono font-bold text-[var(--color-navy-900)] text-xl tracking-widest">{v.id.split('-').pop()?.toUpperCase()}</p>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}
