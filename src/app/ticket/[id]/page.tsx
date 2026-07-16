"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Ship, Loader2, MapPin, Calendar, Clock, 
  Anchor, ShieldCheck, Printer, Lock, CreditCard 
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <p className="text-navy font-bold tracking-widest uppercase text-sm animate-pulse">Generating Boarding Pass...</p>
      </div>
    );
  }

  if (!booking) return null;

  // =========================================================
  // GATEKEEPER: KUNCI TIKET JIKA BELUM LUNAS
  // =========================================================
  if (booking.status !== 'PAID') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 selection:bg-gold selection:text-navy">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-md w-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-2xl pointer-events-none" />
           
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 relative z-10">
             <Lock className="w-8 h-8 text-gray-400" />
           </div>
           
           <h1 className="text-2xl font-extrabold text-navy mb-2 relative z-10">Boarding Pass Locked</h1>
           <p className="text-gray-500 text-sm mb-8 leading-relaxed relative z-10">
             {booking.status === 'WAITING_VERIFICATION' 
               ? "Your payment is currently being verified by our Harbor Master. The boarding pass will be unlocked once confirmed." 
               : "This official boarding pass is securely locked because the payment has not been completed."}
           </p>
           
           <div className="relative z-10">
             {booking.status === 'PENDING' ? (
               <button onClick={() => router.push(`/payment?order_id=${booking.id}`)} className="w-full bg-gold hover:bg-[#b8972e] text-navy py-4 rounded-xl font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-1">
                 <CreditCard className="w-5 h-5" /> Proceed to Payment
               </button>
             ) : (
               <button onClick={() => router.push('/dashboard')} className="w-full bg-navy hover:bg-[#122643] text-white py-4 rounded-xl font-extrabold transition-all shadow-lg hover:-translate-y-1">
                 Return to Vault
               </button>
             )}
           </div>
        </div>
      </div>
    );
  }

  // Format Tanggal Premium
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 font-sans print:bg-white print:py-0 selection:bg-gold selection:text-navy">
      
      {/* Tombol Print (Sembunyi saat dicetak) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center px-4 print:hidden">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-navy font-bold text-sm transition-colors flex items-center gap-2">
          &larr; Back to Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="bg-navy hover:bg-[#122643] text-white px-6 py-3.5 rounded-xl font-extrabold flex items-center gap-2 shadow-lg transition-all hover:-translate-y-1"
        >
          <Printer className="w-4 h-4" /> Save as PDF / Print
        </button>
      </div>

      {/* ========================================================= */}
      {/* AREA KERTAS E-TICKET (A4 Size Approach)                     */}
      {/* ========================================================= */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none relative print-color-adjust-exact">
        
        {/* Desain Latar E-Ticket Premium */}
        <div className="absolute top-0 left-0 w-2.5 h-full bg-gold z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-navy/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 opacity-[0.02] pointer-events-none z-0">
            <Anchor className="w-96 h-96" />
        </div>

        <div className="p-10 md:p-14 relative z-20">
          
          {/* HEADER: LOGO & STATUS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-100 pb-8 mb-10">
            <div className="flex items-center gap-5 mb-6 md:mb-0">
              <div className="bg-navy p-4 rounded-2xl shadow-md border border-navy/20">
                <Ship className="w-10 h-10 text-gold" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight uppercase">PMM Reserve</h1>
                <p className="text-xs font-bold text-gold tracking-widest uppercase mt-1">Official Boarding Pass</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Booking Reference</p>
              <p className="text-2xl md:text-3xl font-mono font-extrabold text-navy tracking-wider">{booking.id}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Confirmed & Secured
              </div>
            </div>
          </div>

          {/* MAIN ITINERARY & QR CODE */}
          <div className="flex flex-col md:flex-row gap-10 mb-12">
            
            {/* Kiri: Itinerary */}
            <div className="flex-1 bg-gray-50/80 p-8 rounded-3xl border border-gray-100 shadow-inner">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Anchor className="w-4 h-4 text-gold" /> Voyage Itinerary
              </h3>
              
              <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-navy"/> Route</p>
                  <p className="text-base font-extrabold text-navy">Lombok ➔ Komodo</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3 text-navy"/> Duration</p>
                  <p className="text-base font-extrabold text-navy">4 Days 3 Nights</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-navy"/> Departure Date</p>
                  <p className="text-xl font-extrabold text-navy">{formatDate(booking.dateOfDeparture)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1"><Ship className="w-3 h-3 text-navy"/> Cabin Class</p>
                  <p className="text-lg font-extrabold text-navy">{booking.cabinClass}</p>
                </div>
              </div>
            </div>

            {/* Kanan: QR Code (Dinamis dengan Bingkai Scan) */}
            <div className="shrink-0 flex flex-col items-center justify-center p-8 bg-white border border-gray-100 shadow-sm rounded-3xl relative">
              {/* Corner Brackets untuk estetika QR */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-gold rounded-tl-sm" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-gold rounded-tr-sm" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-gold rounded-bl-sm" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-gold rounded-br-sm" />
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${booking.id}&color=0B192C`} 
                alt="QR Code" 
                className="w-36 h-36 md:w-40 md:h-40 mb-4 mix-blend-multiply"
              />
              <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest text-center leading-relaxed">
                Scan at Harbor <br/> Check-in Desk
              </p>
            </div>
          </div>

          {/* PASSENGER MANIFEST */}
          <div className="mb-12">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-5 border-b-2 border-gray-100 pb-3 flex items-center gap-2">
              Passenger Manifest <span className="bg-navy text-white px-2 py-0.5 rounded text-[9px]">{booking.paxCount} Pax</span>
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Full Name</th>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200">Passport</th>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 hidden md:table-cell">Nationality</th>
                  <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {booking.passengersManifest?.map((pax: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50/50">
                    <td className="py-5 text-sm font-extrabold text-navy">
                      {pax.fullName}
                      {idx === 0 && <span className="ml-2 bg-gold/10 text-gold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">Lead</span>}
                    </td>
                    <td className="py-5 text-sm font-mono font-bold text-gray-600">{pax.passportNumber}</td>
                    <td className="py-5 text-sm font-bold text-gray-600 hidden md:table-cell">{pax.nationality}</td>
                    <td className="py-5 text-right">
                      {pax.dietaryRequirements && pax.dietaryRequirements !== 'None' ? (
                        <span className="text-[9px] bg-red-50 text-red-600 font-extrabold uppercase px-2 py-1 rounded-md border border-red-100">
                          {pax.dietaryRequirements}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TERMS & FOOTER */}
          <div className="bg-navy p-6 md:p-8 rounded-2xl border border-navy/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
            <h4 className="text-[10px] font-extrabold text-gold uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
              <ShieldCheck className="w-4 h-4" /> Important Boarding Information
            </h4>
            <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside relative z-10 leading-relaxed">
              <li>Please arrive at the designated meeting point at least <strong className="text-white">2 hours</strong> before departure.</li>
              <li>You must present this physical or digital boarding pass along with your original passport.</li>
              <li>Baggage allowance is strictly 20kg per passenger. Soft duffel bags are highly recommended.</li>
              <li>Emergency Contact / Harbor Master: <strong className="text-white">+62 812-3456-7890</strong> (PMM Reserve 24/7 Concierge).</li>
            </ul>
          </div>

        </div>
      </div>

      {/* STYLING KHUSUS UNTUK PRINT */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}} />
    </div>
  );
}