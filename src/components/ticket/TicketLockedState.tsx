import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Booking } from '@/types/booking';

interface TicketLockedStateProps {
  booking: Booking;
}

export function TicketLockedState({ booking }: TicketLockedStateProps) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 md:p-14 rounded-sm shadow-luxury border border-gray-200/50 text-center max-w-md w-full relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-surface-50)] rounded-bl-full pointer-events-none" />
         
         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 relative z-10">
           <Lock className="w-6 h-6 text-[var(--color-navy-900)]" />
         </div>
         
         <h1 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3 relative z-10">Ticket Locked</h1>
         <p className="text-gray-500 text-xs font-light mb-8 leading-relaxed relative z-10">
           {booking.status === 'WAITING_VERIFICATION' 
             ? "We are verifying your payment. Your ticket will be available soon." 
             : "Please complete your payment to get your ticket."}
         </p>
         
         <div className="relative z-10">
           {booking.status === 'PENDING' ? (
             <Button onClick={() => router.push(`/payment?order_id=${booking.id}`)} className="w-full !rounded-sm !py-3.5 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
               <CreditCard className="w-4 h-4" /> Pay Now
             </Button>
           ) : (
             <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full !rounded-sm !py-3.5 uppercase tracking-widest text-xs">
               Back to Dashboard
             </Button>
           )}
         </div>
      </div>
    </div>
  );
}
