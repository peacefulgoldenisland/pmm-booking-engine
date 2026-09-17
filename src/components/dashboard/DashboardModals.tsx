import React from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, PlaneTakeoff, Wine, Compass } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BookingCard, Booking } from './BookingCard';

interface PastVoyagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastBookings: Booking[];
  expandedBookingId: string | null;
  onToggleExpand: (id: string) => void;
  userProfile: any;
}

export function PastVoyagesModal({ 
  isOpen, 
  onClose, 
  pastBookings, 
  expandedBookingId, 
  onToggleExpand, 
  userProfile 
}: PastVoyagesModalProps) {
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historical Logs" maxWidth="3xl">
      <div className="space-y-0 pt-2">
        {pastBookings.length === 0 ? (
          <div className="bg-white rounded-sm p-16 text-center border border-gray-200/60 shadow-sm">
            <div className="w-16 h-16 bg-[var(--color-surface-50)] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <Anchor className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3">Vault Empty</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">
              Your historical maritime logs will appear here once you complete a journey.
            </p>
          </div>
        ) : (
          pastBookings.map((booking) => (
            <BookingCard 
              key={booking.id}
              booking={booking}
              isExpanded={expandedBookingId === booking.id}
              onToggleExpand={onToggleExpand}
              userProfile={userProfile}
            />
          ))
        )}
      </div>
    </Modal>
  );
}

interface ConciergeServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConciergeServicesModal({ isOpen, onClose }: ConciergeServicesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Concierge Offerings" maxWidth="3xl">
      <div className="space-y-8 pt-2">
        <div className="bg-[var(--color-navy-900)] rounded-sm p-8 text-white relative overflow-hidden border border-[var(--color-gold-500)]/20 shadow-luxury">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=2000&auto=format&fit=crop")' }} />
          <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--color-gold-500)]/20 rounded-bl-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-serif mb-2 text-[var(--color-gold-400)]">Elevate Your Journey</h2>
            <p className="text-gray-300 text-sm font-light leading-relaxed max-w-lg">
              Our master concierge is preparing exclusive bespoke additions for your upcoming voyages. Stay tuned.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { title: "Private Yacht Charter", desc: "Commandeer the entire phinisi exclusively.", icon: Anchor },
            { title: "Helicopter Transfer", desc: "Direct VIP flight to the departure harbor.", icon: PlaneTakeoff },
            { title: "In-Cabin Champagne", desc: "Dom Pérignon chilled upon your arrival.", icon: Wine },
            { title: "Private Dive Master", desc: "Dedicated 1-on-1 underwater instructor.", icon: Compass },
          ].map((service, idx) => {
            const Icon = service.icon;
            return (
              <div key={idx} className="bg-[var(--color-surface-50)] p-6 rounded-sm border border-gray-200 relative overflow-hidden group hover:border-[var(--color-gold-300)] transition-colors">
                <div className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">
                  Soon
                </div>
                <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center mb-5 border border-gray-200 group-hover:border-[var(--color-gold-300)] shadow-sm transition-colors">
                  <Icon className="w-5 h-5 text-[var(--color-navy-800)] group-hover:text-[var(--color-gold-600)] transition-colors" />
                </div>
                <h3 className="text-lg font-serif text-[var(--color-navy-900)] mb-1.5">{service.title}</h3>
                <p className="text-xs text-gray-500 font-light">{service.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
