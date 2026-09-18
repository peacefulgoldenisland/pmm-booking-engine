import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { RewardCatalogItem } from '@/types/voucher';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReward: RewardCatalogItem | null;
  modalState: 'confirm' | 'success' | 'error';
  isRedeeming: boolean;
  errorMessage: string;
  handleRedeem: () => void;
  onRestart: () => void;
  onInspectInventory: () => void;
}

export function RedeemModal({ 
  isOpen, 
  onClose, 
  selectedReward, 
  modalState, 
  isRedeeming, 
  errorMessage, 
  handleRedeem, 
  onRestart, 
  onInspectInventory 
}: RedeemModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privilege Authorization">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          
          {modalState === 'confirm' && (
            <motion.div 
              key="confirm" 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }} 
              className="space-y-6 pt-2"
            >
              <div className="bg-[var(--color-surface-50)] p-8 rounded-sm border border-[var(--color-gold-200)] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-gold-500)]/10 rounded-bl-full pointer-events-none" />
                <Gift className="w-10 h-10 text-[var(--color-gold-600)] mx-auto mb-4" />
                <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2 relative z-10">{selectedReward?.name}</h3>
                <p className="text-xs text-gray-500 mb-8 font-light leading-relaxed relative z-10">{selectedReward?.desc}</p>
                
                <div className="bg-white p-5 rounded-sm border border-gray-200 flex justify-between items-center shadow-sm relative z-10">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mileage Deduction</span>
                  <span className="text-xl font-serif text-red-600">-{selectedReward?.cost} Pts</span>
                </div>
              </div>
              
              <Button 
                onClick={handleRedeem} 
                isLoading={isRedeeming} 
                className="w-full !py-4 uppercase tracking-widest text-xs !rounded-sm shadow-luxury"
              >
                Authorize Deduction
              </Button>
            </motion.div>
          )}

          {modalState === 'success' && (
            <motion.div 
              key="success" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="text-center py-8 space-y-8"
            >
              <div className="w-20 h-20 bg-green-50/50 rounded-full flex items-center justify-center mx-auto shadow-sm border border-green-200">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-3xl font-serif text-[var(--color-navy-900)] mb-3">Code Vaulted!</h3>
                <p className="text-sm font-light text-gray-500 leading-relaxed px-4">The cryptographic discount code has been injected into your active inventory. You may utilize it on your next maritime checkout.</p>
              </div>
              <Button 
                onClick={onInspectInventory} 
                variant="outline" 
                className="w-full !py-4 !rounded-sm uppercase tracking-widest text-xs"
              >
                Inspect Inventory
              </Button>
            </motion.div>
          )}

          {modalState === 'error' && (
            <motion.div 
              key="error" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="text-center py-8 space-y-8"
            >
              <div className="w-20 h-20 bg-red-50/50 rounded-full flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-3xl font-serif text-[var(--color-navy-900)] mb-3">Deduction Failed</h3>
                <p className="text-sm font-light text-gray-500">{errorMessage}</p>
              </div>
              <Button 
                onClick={onRestart} 
                variant="outline" 
                className="w-full !py-4 !rounded-sm uppercase tracking-widest text-xs"
              >
                Restart Protocol
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Modal>
  );
}
