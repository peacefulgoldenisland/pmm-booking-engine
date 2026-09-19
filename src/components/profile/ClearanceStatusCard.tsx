import React from 'react';
import { Award, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import type { GuestProfile } from '@/types/user';

interface ClearanceStatusCardProps {
  userProfile: GuestProfile | null;
  onEditProfile: () => void;
}

export function ClearanceStatusCard({ userProfile, onEditProfile }: ClearanceStatusCardProps) {
  return (
    <div className="lg:col-span-4 bg-[var(--color-surface-50)] p-8 md:p-10 flex flex-col gap-8">
      
      {/* Rewards Block */}
      <div className="bg-[var(--color-navy-900)] p-6 rounded-sm relative overflow-hidden shadow-sm">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Award className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-medium text-[var(--color-gold-400)] uppercase tracking-widest mb-1">Total Reward Points</p>
          <p className="text-4xl font-serif text-white tracking-tight mb-4">
            {userProfile?.pointsBalance || 0}
          </p>
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] text-gray-400 font-light leading-relaxed">Use your points to get discounts and upgrades on your next bookings.</p>
          </div>
        </div>
      </div>

      {/* Document Status Block */}
      <div>
        <h3 className="text-sm font-serif text-[var(--color-navy-900)] mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--color-gold-500)]" /> Document Status
        </h3>
        
        {userProfile?.passportFileUrl ? (
          <div className="bg-white border border-green-200 p-5 rounded-sm shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="font-serif text-[var(--color-navy-900)] text-sm">Identity Verified</p>
            </div>
            <p className="text-[11px] text-gray-500 font-light leading-relaxed mb-4">Your travel document has been successfully verified.</p>
            <a 
              href={userProfile.passportFileUrl as string} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gray-50 border border-gray-200 hover:border-green-300 text-[var(--color-navy-900)] py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors text-center"
            >
              View Document
            </a>
          </div>
        ) : (
          <div className="bg-white border border-red-200 p-5 rounded-sm shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="font-serif text-[var(--color-navy-900)] text-sm">Action Required</p>
            </div>
            <p className="text-[11px] text-gray-500 font-light leading-relaxed mb-4">A valid passport or ID scan is required prior to departure.</p>
            <Button 
              onClick={onEditProfile}
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700 w-full !py-2.5 !rounded-sm !text-[10px] uppercase tracking-widest !shadow-none"
            >
              Upload Document
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
