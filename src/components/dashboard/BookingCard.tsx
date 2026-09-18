import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Users, ChevronDown, CreditCard, 
  Clock, Ticket, Calendar, User, Anchor
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReviewManager } from '@/components/dashboard/ReviewManager';
import type { Booking } from '@/types/booking';
import type { GuestProfile } from '@/types/user';

interface BookingCardProps {
  booking: Booking;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  userProfile: GuestProfile | null;
}

export function BookingCard({ booking, isExpanded, onToggleExpand, userProfile }: BookingCardProps) {
  const router = useRouter();

  const getDayAndMonth = (dateObj: any) => {
    if (!dateObj) return { day: '-', month: '-', year: '-' };
    const d = typeof dateObj === 'string' || typeof dateObj === 'number' 
      ? new Date(dateObj) 
      : dateObj.toDate?.() || new Date();
    return {
      day: d.toLocaleDateString('en-US', { day: '2-digit' }),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.toLocaleDateString('en-US', { year: 'numeric' })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 shadow-sm">Secured</span>;
      case 'WAITING_VERIFICATION':
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">Verifying</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 shadow-sm">Action Req</span>;
      default:
        return <span className="px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[var(--color-surface-50)] text-gray-500 border border-gray-200 shadow-sm">{status}</span>;
    }
  };

  const dateInfo = getDayAndMonth(booking.dateOfDeparture);

  return (
    <div className="bg-white rounded-sm shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/80 overflow-hidden transition-all duration-300 mb-5 relative group">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-navy-900)]" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 cursor-pointer pl-8 md:pl-10" onClick={() => onToggleExpand(booking.id)}>
        <div className="flex items-center gap-6 md:w-5/12 mb-6 md:mb-0">
          <div className="bg-[var(--color-surface-50)] border border-gray-200 rounded-sm w-16 h-16 flex flex-col items-center justify-center shrink-0 group-hover:border-[var(--color-gold-300)] transition-colors">
            <span className="text-[var(--color-gold-600)] text-[10px] font-bold uppercase tracking-widest leading-none">{dateInfo.month}</span>
            <span className="text-[var(--color-navy-900)] text-2xl font-serif leading-tight mt-1">{dateInfo.day}</span>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Itinerary</p>
            <p className="text-lg md:text-xl font-serif text-[var(--color-navy-900)] flex items-center gap-2">
              Lombok <ArrowRight className="w-4 h-4 text-[var(--color-gold-500)]" /> Komodo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 md:w-4/12 mb-6 md:mb-0 md:border-l border-gray-100 md:pl-8">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Assigned Quarters</p>
            <p className="text-sm font-medium text-[var(--color-navy-900)] truncate max-w-[150px]">{booking.cabinClass}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Party Size</p>
            <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400"/> {booking.paxCount} Pax
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 md:w-3/12">
          {getStatusBadge(booking.status)}
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all border ${isExpanded ? 'bg-[var(--color-navy-900)] border-[var(--color-navy-900)] text-white' : 'bg-transparent border-gray-200 text-gray-400 group-hover:border-[var(--color-navy-900)] group-hover:text-[var(--color-navy-900)]'}`}>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-[var(--color-surface-50)] overflow-hidden"
          >
            <div className="p-6 md:p-10 pl-8 md:pl-10">
              {/* Dynamic Grid Layout */}
              <div className={`grid grid-cols-1 ${booking.status === 'PAID' ? 'lg:grid-cols-2' : ''} gap-10`}>
                <div>
                  <h4 className="text-[9px] font-bold text-[var(--color-gold-600)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                    <User className="w-3.5 h-3.5" /> Registered Guests
                  </h4>
                  <div className="space-y-3">
                    {booking.passengersManifest?.map((pax: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-sm border border-gray-200 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-sm font-serif text-[var(--color-navy-900)] flex items-center gap-2">
                            {pax.fullName}
                            {idx === 0 && <span className="bg-[var(--color-gold-500)] text-[var(--color-navy-900)] text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Principal</span>}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                            {pax.nationality} • {pax.gender} • ID: {pax.passportNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {booking.status === 'PAID' && (
                  <div>
                    <h4 className="text-[9px] font-bold text-[var(--color-gold-600)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                      Feedback & Review
                    </h4>
                    <ReviewManager booking={booking} userProfile={userProfile} />
                  </div>
                )}
              </div>
            </div>

            {/* Action Banners Footer */}
            <div className="border-t border-gray-200/60 bg-white p-4 md:px-10 flex flex-wrap items-center justify-end gap-4">
                {booking.status === 'PENDING' && (
                  <Button onClick={() => router.push(`/payment?order_id=${booking.id}`)} variant="primary" className="!rounded-sm !py-2.5 !px-6 !text-[10px] uppercase tracking-widest !bg-red-600 hover:!bg-red-700 !shadow-none flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Remit Payment
                  </Button>
                )}
                {booking.status === 'WAITING_VERIFICATION' && (
                  <div className="bg-amber-50/50 text-amber-700 text-xs font-medium px-6 py-2.5 rounded-sm flex items-center gap-2 border border-amber-200 shadow-sm w-full md:w-auto">
                    <Clock className="w-4 h-4" /> Harbor Master is authenticating transaction
                  </div>
                )}
                {booking.status === 'PAID' && (
                  <>
                    {(typeof booking.dateOfDeparture === 'string' || typeof booking.dateOfDeparture === 'number' ? new Date(booking.dateOfDeparture) : (booking.dateOfDeparture as any)?.toDate?.() || new Date()) >= new Date() && (
                      <Button onClick={() => router.push(`/dashboard/reschedule/${booking.id}`)} variant="outline" className="!rounded-sm !py-2.5 !px-6 !text-[10px] uppercase tracking-widest flex items-center gap-2 text-gray-500 hover:text-[var(--color-navy-900)]">
                        <Calendar className="w-4 h-4" /> Modify Dates
                      </Button>
                    )}
                    <Button onClick={() => window.open(`/ticket/${booking.id}`, '_blank')} variant="outline" className="!rounded-sm !py-2.5 !px-6 !text-[10px] uppercase tracking-widest flex items-center gap-2 border-[var(--color-navy-900)] text-[var(--color-navy-900)] hover:bg-[var(--color-surface-50)]">
                      <Ticket className="w-4 h-4" /> Retrieve Manifest
                    </Button>
                  </>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
