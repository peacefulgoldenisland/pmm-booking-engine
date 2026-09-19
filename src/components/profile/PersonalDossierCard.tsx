import React from 'react';
import { User, Phone, Globe, CreditCard, Utensils, Shield } from 'lucide-react';

import type { GuestProfile } from '@/types/user';

interface PersonalDossierCardProps {
  userProfile: GuestProfile | null;
}

export function PersonalDossierCard({ userProfile }: PersonalDossierCardProps) {
  return (
    <div className="lg:col-span-8 p-8 md:p-10 relative">
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
        <Shield className="w-[400px] h-[400px] text-[var(--color-navy-900)]" />
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2">Personal Information</h2>
        <p className="text-gray-500 text-xs font-light leading-relaxed max-w-lg">
          Keep your personal information up to date to ensure a smooth booking process and travel experience.
        </p>
      </div>

      {/* Data Grid Clean Editorial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
        
        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Full Name
          </p>
          <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.fullName ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
            {userProfile?.fullName || 'Not provided'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" /> Contact Number
          </p>
          <p className={`font-mono text-base tracking-widest border-b border-gray-100 pb-2 ${userProfile?.phone ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic font-sans tracking-normal'}`}>
            {userProfile?.phone || 'Not provided'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Nationality
          </p>
          <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.nationality ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
            {userProfile?.nationality || 'Not provided'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Gender
          </p>
          <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.gender ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
            {userProfile?.gender || 'Not provided'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Passport / ID Number
          </p>
          <p className={`font-mono text-base tracking-widest uppercase border-b border-gray-100 pb-2 ${userProfile?.passportNumber ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic font-sans tracking-normal'}`}>
            {userProfile?.passportNumber || 'Not provided'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
            <Utensils className="w-3.5 h-3.5" /> Dietary Restrictions
          </p>
          <p className={`font-serif text-xl border-b border-gray-100 pb-2 ${userProfile?.dietaryRequirements ? 'text-[var(--color-navy-900)]' : 'text-gray-300 italic'}`}>
            {userProfile?.dietaryRequirements || 'None specified'}
          </p>
        </div>

      </div>
    </div>
  );
}
