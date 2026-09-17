import React from 'react';
import { Calendar, Ship, Users, MapPin } from 'lucide-react';

interface CurrentManifestCardProps {
  booking: any;
}

export function CurrentManifestCard({ booking }: CurrentManifestCardProps) {
  const formatDateUI = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="bg-white p-8 md:p-10 shadow-luxury border border-gray-100 h-max relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-navy-900)]" />
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[var(--color-gold-500)]" /> Current Manifest
      </h4>

      <div className="space-y-8">
        <div>
          <p className="text-xs text-gray-500 font-light mb-1">Scheduled Departure</p>
          <p className="text-2xl font-serif text-[var(--color-navy-900)]">
            {formatDateUI(booking.dateOfDeparture)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-light mb-1.5">Accommodations</p>
            <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2">
              <Ship className="w-4 h-4 text-gray-400"/> {booking.cabinClass}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-light mb-1.5">Party Size</p>
            <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400"/> {booking.paxCount} Guests
            </p>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-light mb-1.5">Expedition Route</p>
          <p className="text-sm font-medium text-[var(--color-navy-900)] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--color-gold-500)]"/> Lombok to Komodo
          </p>
        </div>
      </div>
    </div>
  );
}
