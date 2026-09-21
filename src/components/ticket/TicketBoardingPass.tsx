import React from 'react';
import { 
  Ship, MapPin, Calendar, Clock, 
  Anchor, ShieldCheck 
} from 'lucide-react';
import type { Booking } from '@/types/booking';

interface TicketBoardingPassProps {
  booking: Booking;
}

export function TicketBoardingPass({ booking }: TicketBoardingPassProps) {
  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-";
    const d = typeof dateObj === 'string' || typeof dateObj === 'number' 
        ? new Date(dateObj) 
        : dateObj.toDate?.() || new Date();
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="max-w-[850px] mx-auto bg-white shadow-luxury overflow-hidden print:overflow-visible print:shadow-none print:w-full relative print-color-adjust-exact">
      
      {/* Desain Aksent Atas E-Ticket */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[var(--color-navy-900)] z-10 print:hidden" />
      <div className="absolute top-2 left-0 w-full h-0.5 bg-[var(--color-gold-500)] z-10 print:hidden" />
      
      {/* Watermark Tengah */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0 print:hidden">
          <Anchor className="w-[400px] h-[400px] text-[var(--color-navy-900)]" />
      </div>

      <div className="p-10 md:p-16 relative z-20">
        
        {/* HEADER: LOGO & STATUS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-300 pb-8 mb-10 break-inside-avoid">
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            <div className="w-16 h-16 border border-[var(--color-navy-900)] rounded-sm flex items-center justify-center shrink-0">
              <Ship className="w-8 h-8 text-[var(--color-navy-900)]" />
            </div>
            <div>
              <h1 className="text-3xl font-serif text-[var(--color-navy-900)] tracking-tight uppercase">PGI Booking</h1>
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mt-1">E-Ticket</p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Booking Reference</p>
            <p className="text-3xl font-mono text-[var(--color-navy-900)] tracking-widest">{booking.id}</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50/50 text-green-700 border border-green-200 px-3 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Confirmed
            </div>
          </div>
        </div>

        {/* MAIN ITINERARY & QR CODE */}
        <div className="flex flex-col md:flex-row gap-12 mb-14 break-inside-avoid">
          
          {/* Kiri: Itinerary Data */}
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div className="grid grid-cols-2 gap-y-8 gap-x-8">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[var(--color-gold-500)]"/> Route
                </p>
                <p className="text-lg font-serif text-[var(--color-navy-900)] border-b border-gray-100 pb-2">Lombok ➔ Komodo</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[var(--color-gold-500)]"/> Duration
                </p>
                <p className="text-lg font-serif text-[var(--color-navy-900)] border-b border-gray-100 pb-2">4 Days 3 Nights</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[var(--color-gold-500)]"/> Departure Date
                </p>
                <p className="text-2xl font-serif text-[var(--color-navy-900)] border-b border-gray-100 pb-2">{formatDate(booking.dateOfDeparture)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Ship className="w-3 h-3 text-[var(--color-gold-500)]"/> Cabin Class
                </p>
                <p className="text-xl font-serif text-[var(--color-navy-900)] border-b border-gray-100 pb-2">{booking.cabinClass}</p>
              </div>
            </div>
          </div>

          {/* Kanan: QR Code Box */}
          <div className="shrink-0 flex flex-col items-center justify-center p-8 border border-gray-200 bg-[var(--color-surface-50)] rounded-sm relative w-full md:w-auto h-max">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${booking.id}&color=0B192C&bgcolor=fdfbf7`} 
              alt="QR Code" 
              className="w-40 h-40 mb-4 mix-blend-multiply border border-gray-200 p-2 bg-white"
            />
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center leading-relaxed">
              Scan at Harbor
            </p>
          </div>
        </div>

        {/* PASSENGER MANIFEST */}
        <div className="mb-14">
          <div className="flex items-end justify-between border-b border-[var(--color-navy-900)] pb-2 mb-6 break-inside-avoid">
            <h3 className="text-sm font-serif text-[var(--color-navy-900)] uppercase tracking-widest">
              Guest Details
            </h3>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-[var(--color-surface-50)] px-2 py-1 rounded-sm border border-gray-200">
              {booking.paxCount} Pax
            </span>
          </div>
          
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="break-inside-avoid">
                  <th className="py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 w-1/3">Full Name</th>
                  <th className="py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Passport / ID</th>
                  <th className="py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 hidden sm:table-cell print:table-cell">Origin</th>
                  <th className="py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 text-right">Dietary</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengersManifest?.map((pax: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 group break-inside-avoid">
                    <td className="py-4">
                      <span className="text-sm font-serif text-[var(--color-navy-900)] block">
                        {pax.fullName}
                      </span>
                      {idx === 0 && <span className="inline-block mt-1 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Primary Guest</span>}
                    </td>
                    <td className="py-4 text-xs font-mono tracking-widest text-[var(--color-navy-900)] uppercase">
                      {pax.passportNumber}
                    </td>
                    <td className="py-4 text-xs font-serif text-gray-600 hidden sm:table-cell print:table-cell">
                      {pax.nationality}
                    </td>
                    <td className="py-4 text-right">
                      {pax.dietaryRequirements && pax.dietaryRequirements !== 'None' ? (
                        <span className="text-[9px] bg-[var(--color-surface-50)] text-gray-600 font-bold uppercase px-2 py-1 rounded-sm border border-gray-200">
                          {pax.dietaryRequirements}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TERMS & CONDITIONS (FOOTER TIKET) */}
        <div className="bg-[var(--color-surface-50)] p-8 border border-gray-200 rounded-sm break-inside-avoid">
          <h4 className="text-[9px] font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-gold-500)]" /> Important Information
          </h4>
          <ul className="text-[11px] text-gray-500 space-y-3 font-light leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
              <span>Please arrive at the harbor <strong className="text-[var(--color-navy-900)] font-medium">2 hours</strong> before departure.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
              <span>Please show this e-ticket and your original ID/Passport when checking in.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
              <span>Baggage allowance is 20kg per guest. Soft luggage is recommended.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
              <span>24/7 Support Line: <strong className="text-[var(--color-navy-900)] font-mono">+62 812-3456-7890</strong>.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
