import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Crown, Gift, Tag, Star, Gem } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const ICON_MAP: Record<string, any> = {
  Ticket, Gift, Crown, Tag, Star, Gem
};

import type { RewardCatalogItem } from '@/types/voucher';
import type { GuestProfile } from '@/types/user';

interface RewardCatalogProps {
  catalog: RewardCatalogItem[];
  isLoadingData: boolean;
  userData: GuestProfile | null;
  openRedeemModal: (reward: RewardCatalogItem) => void;
}

export function RewardCatalog({ catalog, isLoadingData, userData, openRedeemModal }: RewardCatalogProps) {
  return (
    <motion.div key="catalog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoadingData ? (
        Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-full h-[280px] rounded-sm shadow-sm" />
        ))
      ) : (
        catalog.map((reward) => {
          const Icon = ICON_MAP[reward.iconName] || Ticket;
          const canAfford = (userData?.pointsBalance || 0) >= reward.cost;

          return (
            <div key={reward.id} className="bg-white rounded-sm p-8 shadow-sm hover:shadow-luxury border border-gray-200/50 transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-12 h-12 bg-[var(--color-surface-50)] group-hover:bg-[var(--color-gold-50)] rounded-lg flex items-center justify-center mb-6 transition-colors border border-gray-100 group-hover:border-[var(--color-gold-200)]">
                <Icon className="w-5 h-5 text-[var(--color-navy-800)] group-hover:text-[var(--color-gold-600)] transition-colors" />
              </div>
              
              <h3 className="text-xl font-serif text-[var(--color-navy-900)] mb-2 pr-4">{reward.name}</h3>
              <p className="text-xs text-gray-500 mb-8 font-light leading-relaxed flex-grow">{reward.desc}</p>
              
              <div className="pt-6 border-t border-gray-100 mt-auto flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mb-1">Required Miles</p>
                  <div className="font-serif text-[var(--color-navy-900)] text-2xl">{reward.cost}</div>
                </div>
                <Button 
                  onClick={() => openRedeemModal(reward)}
                  disabled={!canAfford}
                  variant={canAfford ? 'primary' : 'outline'}
                  className="!rounded-sm !py-2.5 !px-5 !text-xs uppercase tracking-widest"
                >
                  Redeem
                </Button>
              </div>
            </div>
          );
        })
      )}
    </motion.div>
  );
}
