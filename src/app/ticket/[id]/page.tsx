"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Ship, Loader2, MapPin, Calendar, Clock, 
  Anchor, ShieldCheck, Printer, Lock, CreditCard, ArrowLeft
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 800); 
      }
    };
    fetchBooking();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)] mb-4" />
        <p className="text-[var(--color-navy-900)] font-serif text-xl animate-pulse">Generating Boarding Pass...</p>
      </div>
    );
  }

  if (!booking) return null;

  // =========================================================
  // GATEKEEPER: KUNCI TIKET JIKA BELUM LUNAS
  // =========================================================
  if (booking.status !== 'PAID') {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 md:p-14 rounded-sm shadow-luxury border border-gray-200/50 text-center max-w-md w-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-surface-50)] rounded-bl-full pointer-events-none" />
           
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 relative z-10">
             <Lock className="w-6 h-6 text-[var(--color-navy-900)]" />
           </div>
           
           <h1 className="text-2xl font-serif text-[var(--color-navy-900)] mb-3 relative z-10">Boarding Pass Locked</h1>
           <p className="text-gray-500 text-xs font-light mb-8 leading-relaxed relative z-10">
             {booking.status === 'WAITING_VERIFICATION' 
               ? "Your remittance is currently being verified by our Harbor Master. The official boarding pass will be decrypted upon authorization." 
               : "This official document is securely vaulted. Please finalize your transaction to generate the boarding pass."}
           </p>
           
           <div className="relative z-10">
             {booking.status === 'PENDING' ? (
               <Button onClick={() => router.push(`/payment?order_id=${booking.id}`)} className="w-full !rounded-sm !py-3.5 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                 <CreditCard className="w-4 h-4" /> Finalize Transaction
               </Button>
             ) : (
               <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full !rounded-sm !py-3.5 uppercase tracking-widest text-xs">
                 Return to Vault
               </Button>
             )}
           </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] py-8 font-sans print:bg-white print:py-0">
      
      {/* Navigation & Actions (Sembunyi saat dicetak) */}
      <div className="max-w-[850px] mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center px-4 gap-4 print:hidden">
        <button 
          onClick={() => router.back()} 
          className="text-[var(--color-navy-900)] hover:text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Member Dashboard
        </button>
        <Button 
          onClick={handlePrint}
          className="!rounded-sm !py-3 !px-6 uppercase tracking-widest text-xs flex items-center gap-2 shadow-luxury"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      {/* ========================================================= */}
      {/* KERTAS E-TICKET (Mendukung Multi-Page Print)              */}
      {/* ========================================================= */}
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
                <h1 className="text-3xl font-serif text-[var(--color-navy-900)] tracking-tight uppercase">PMM Reserve</h1>
                <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mt-1">Official Boarding Pass</p>
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
                    <Ship className="w-3 h-3 text-[var(--color-gold-500)]"/> Assigned Quarters
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
                Harbor Scan
              </p>
            </div>
          </div>

          {/* PASSENGER MANIFEST */}
          <div className="mb-14">
            <div className="flex items-end justify-between border-b border-[var(--color-navy-900)] pb-2 mb-6 break-inside-avoid">
              <h3 className="text-sm font-serif text-[var(--color-navy-900)] uppercase tracking-widest">
                Guest Manifest
              </h3>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-[var(--color-surface-50)] px-2 py-1 rounded-sm border border-gray-200">
                {booking.paxCount} Pax
              </span>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="break-inside-avoid">
                    <th className="py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 w-1/3">Lead / Full Name</th>
                    <th className="py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Travel Document ID</th>
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
                        {idx === 0 && <span className="inline-block mt-1 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Principal Guest</span>}
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
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-gold-500)]" /> Maritime Protocols & Regulations
            </h4>
            <ul className="text-[11px] text-gray-500 space-y-3 font-light leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
                <span>Harbor assembly is strictly mandated <strong className="text-[var(--color-navy-900)] font-medium">2 hours</strong> prior to the scheduled departure time. Failure to appear will result in manifest cancellation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
                <span>This digital boarding pass and the original physical travel documents (Passport/ID) must be presented during clearance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
                <span>Cabin baggage allowance is restricted to 20kg per guest. Soft-shell luggage is highly advised for maritime safety.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold-500)] mt-0.5">•</span>
                <span>24/7 Concierge & Harbor Master Direct Line: <strong className="text-[var(--color-navy-900)] font-mono">+62 812-3456-7890</strong>.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* STYLING KHUSUS UNTUK PRINT */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 1.5cm; /* Memberikan ruang napas di halaman berikutnya */
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important; 
          }
        }
      `}} />
    </div>
  );
}