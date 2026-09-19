"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Minus, Save, ArrowLeft, CircleDollarSign, Loader2, UploadCloud, CheckCircle2
} from 'lucide-react';
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';
import type { VoyageSchedule, MasterCabin } from '@/types/voyage';
import type { Passenger, BookingSource } from '@/types/booking';

function FormGroup({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ManualRegistryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // Reference Data
  const [voyages, setVoyages] = useState<VoyageSchedule[]>([]);
  const [cabins, setCabins] = useState<MasterCabin[]>([]);

  // Form State - Step 1
  const [voyageId, setVoyageId] = useState('');
  const [cabinId, setCabinId] = useState('');
  const [bookedUnits, setBookedUnits] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number | ''>('');

  // Form State - Step 2
  const [source, setSource] = useState<BookingSource>('AGENT');
  const [agentName, setAgentName] = useState('');

  // Form State - Step 3 (Manifest)
  const [passengers, setPassengers] = useState<Passenger[]>([
    { fullName: '', gender: 'M', age: 30, passportNumber: '', nationality: 'INDONESIA', placeOfBirth: '', dateOfBirth: '', dietaryRequirements: 'None', passportFileUrl: '' }
  ]);

  const [uploadingState, setUploadingState] = useState<{ [key: number]: boolean }>({});

  // Lead Guest Contact & Logistic (Optional)
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [voyageSnap, cabinSnap] = await Promise.all([
          getDocs(collection(db, 'voyages')),
          getDocs(collection(db, 'products'))
        ]);
        
        const fetchedVoyages = voyageSnap.docs.map(d => ({ id: d.id, ...d.data() } as VoyageSchedule));
        const fetchedCabins = cabinSnap.docs.map(d => ({ id: d.id, ...d.data() } as MasterCabin));
        
        setVoyages(fetchedVoyages.sort((a, b) => a.id.localeCompare(b.id)));
        setCabins(fetchedCabins);
      } catch (error) {
        console.error("Error fetching reference data", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchData();
  }, []);

  const handleAddPassenger = () => {
    setPassengers([...passengers, { fullName: '', gender: 'M', age: 30, passportNumber: '', nationality: '', placeOfBirth: '', dateOfBirth: '', dietaryRequirements: 'None', passportFileUrl: '' }]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const handlePassengerChange = (index: number, field: string, value: string | number) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [index]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      handlePassengerChange(index, 'passportFileUrl', data.url);
    } catch (err: any) {
      alert(`Failed to upload file: ${err.message}`);
    } finally {
      setUploadingState(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!voyageId || !cabinId || !totalPrice) {
        throw new Error("Please complete Voyage, Cabin, and Price fields.");
      }
      
      const adminUser = auth.currentUser;
      const cabinName = cabins.find(c => c.id === cabinId)?.name || cabinId;
      const generatedBookingId = `PMM-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

      await runTransaction(db, async (transaction) => {
        const voyageRef = doc(db, 'voyages', voyageId);
        const voyageDoc = await transaction.get(voyageRef);
        
        let cabinQuotas: Record<string, number> = {};
        
        if (!voyageDoc.exists()) {
          // Opsi A: Auto-create jadwal keberangkatan jika belum ada
          cabins.forEach(c => {
            cabinQuotas[c.id] = c.totalUnits || 0;
          });
          
          const newVoyage = {
            id: voyageId,
            departureDate: voyageId,
            shipName: 'PMM Phinisi', // Default
            status: 'SCHEDULED',
            cabinQuotas: cabinQuotas,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          transaction.set(voyageRef, newVoyage);
        } else {
          const voyageData = voyageDoc.data() as VoyageSchedule;
          cabinQuotas = voyageData.cabinQuotas || {};
        }

        // Validasi dan Potong Kuota
        const available = cabinQuotas[cabinId] || 0;
        if (available < bookedUnits) {
          throw new Error(`Insufficient quota for ${cabinName}. Only ${available} units left.`);
        }
        
        cabinQuotas[cabinId] -= bookedUnits;
        transaction.update(voyageRef, { cabinQuotas });

        // Buat Booking Document
        const bookingData = {
          id: generatedBookingId,
          bookingId: generatedBookingId,
          userId: 'MANUAL_ENTRY_ADMIN',
          status: 'PAID', // Asumsi dari agent/walk-in sudah dibayar
          source: source,
          agentName: source === 'AGENT' ? agentName : '',
          dateOfDeparture: voyageId,
          cabinClass: cabinName,
          pickupLocation: pickupLocation || 'Not Specified',
          paxCount: passengers.length,
          passengersManifest: passengers,
          contactEmail: leadEmail || 'manual@offline.com',
          contactPhone: leadPhone || '-',
          basePrice: Number(totalPrice),
          discountAmount: 0,
          totalAmount: Number(totalPrice),
          paymentMethod: 'OFFLINE',
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          recordedBy: adminUser?.email || 'Admin',
        };

        const bookingRef = doc(collection(db, 'bookings'), generatedBookingId);
        transaction.set(bookingRef, bookingData);
      });

      alert(`Success! Booking ${generatedBookingId} registered.`);
      router.push('/admin/bookings');
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-navy-900)]" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4 mb-8">
        <AdminButton type="button" variant="outline" onClick={() => router.back()} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </AdminButton>
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Create Booking</h1>
          <p className="text-gray-500 text-sm">Create an offline booking.</p>
        </div>
        
        {/* DEV TOOL: SEED */}
        <div className="ml-auto">
           <AdminButton 
             variant="outline" 
             type="button"
             onClick={async () => {
               if(!confirm("Seed 10 individual bookings (1 pax each) for 19 Sep 2026?")) return;
               setIsLoading(true);
               try {
                 const promises = [];
                 for(let i=0; i<10; i++) {
                   const paxManifest = [{
                      fullName: `Test Individual Pax ${i+1}`,
                      gender: i % 2 === 0 ? 'M' : 'F',
                      age: 20 + i,
                      nationality: 'INDONESIA',
                      passportNumber: `A123456${i}`,
                      dietaryRequirements: 'None',
                      placeOfBirth: 'Lombok',
                      dateOfBirth: `2000-01-0${i % 9 + 1}`,
                      passportFileUrl: ''
                   }];
                   
                   const bookingData = {
                     bookingId: `BK-TEST-${Math.floor(Math.random()*10000)}`,
                     dateOfDeparture: '2026-09-19',
                     paxCount: 1,
                     cabinClass: i % 2 === 0 ? 'CABIN SEA VIEW' : 'DOWN DECK',
                     pickupLocation: 'Senggigi Area',
                     source: 'WEB',
                     agentName: '',
                     contactEmail: `test${i}@example.com`,
                     contactPhone: '08123456789',
                     basePrice: 4600000,
                     discountAmount: 0,
                     totalAmount: 4600000,
                     status: 'PAID',
                     paymentMethod: 'CASH',
                     passengersManifest: paxManifest,
                     createdAt: new Date().toISOString(),
                     verifiedAt: new Date().toISOString(),
                     recordedBy: 'Admin Dev',
                   };
                   
                   promises.push(setDoc(doc(collection(db, 'bookings'), bookingData.bookingId), bookingData));
                 }

                 await Promise.all(promises);
                 alert("10 Bookings seeded successfully!");
                 router.push('/admin/bookings');
               } catch (e: any) {
                 alert("Seed error: " + e.message);
               } finally {
                 setIsLoading(false);
               }
             }}
           >
             Seed 10 Bookings
           </AdminButton>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: ITINERARY & PRICING */}
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <span className="w-6 h-6 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center text-xs font-bold">1</span>
              Trip & Price
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Trip Schedule (Date) <span className="text-red-500">*</span>
               </label>
               <DatePicker 
                 label="" 
                 selectedDate={voyageId ? new Date(voyageId) : null} 
                 onSelect={(date: Date | null) => {
                   if (date) {
                     const offset = date.getTimezoneOffset();
                     const adjustedDate = new Date(date.getTime() - (offset*60*1000));
                     setVoyageId(adjustedDate.toISOString().split('T')[0]);
                   }
                 }} 
                 filterDate={(date: Date) => date.getDay() === 6}
               />
            </div>
            
            <FormGroup label="Cabin Assigned" required>
              <AdminSelect 
                value={cabinId} 
                onChange={(val: string) => setCabinId(val)}
                placeholder="Select Cabin"
                options={cabins.map(c => ({ value: c.id, label: c.name }))}
              />
            </FormGroup>

            <FormGroup label="Units Booked" required>
              <AdminInput 
                type="number" 
                min={1}
                value={bookedUnits} 
                onChange={(e) => setBookedUnits(parseInt(e.target.value) || 1)} 
                required 
              />
            </FormGroup>
            
            <FormGroup label="Total Invoice (IDR)" required>
              <AdminInput 
                type="number"
                value={totalPrice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="4600000"
                leftIcon={<CircleDollarSign className="w-4 h-4 text-gray-400" />}
                required
              />
            </FormGroup>
          </AdminCardContent>
        </AdminCard>

        {/* STEP 2: SOURCE & CONTACT */}
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <span className="w-6 h-6 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center text-xs font-bold">2</span>
              Source & Lead Contact
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormGroup label="Booking Source" required>
                <AdminSelect 
                  value={source} 
                  onChange={(val: string) => setSource(val as BookingSource)}
                  options={[
                    { value: 'AGENT', label: 'Travel Agent' },
                    { value: 'OFFICE', label: 'Internal Office (Walk-in)' }
                  ]}
                />
              </FormGroup>
              
              {source === 'AGENT' && (
                <FormGroup label="Agent Name" required>
                  <AdminInput 
                    value={agentName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value)}
                    placeholder="e.g. AZMI / KOPANG"
                    required
                  />
                </FormGroup>
              )}
            </div>

            <div className="space-y-6">
              <FormGroup label="Lead Contact Phone">
                <AdminInput 
                  value={leadPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLeadPhone(e.target.value)}
                  placeholder="+62..."
                />
              </FormGroup>
              
              <FormGroup label="Lead Contact Email">
                <AdminInput 
                  value={leadEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLeadEmail(e.target.value)}
                  type="email"
                  placeholder="guest@example.com"
                />
              </FormGroup>

              <FormGroup label="Pickup Location (AREA)">
                <AdminInput 
                  value={pickupLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
                  placeholder="e.g. SENGGIGI / BANGSAL"
                />
              </FormGroup>
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* STEP 3: PASSENGER MANIFEST */}
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between">
            <AdminCardTitle className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <span className="w-6 h-6 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center text-xs font-bold">3</span>
              Passenger Details
            </AdminCardTitle>
            <AdminButton type="button" variant="outline" size="sm" onClick={handleAddPassenger}>
              <Plus className="w-4 h-4 mr-2" /> Add Pax
            </AdminButton>
          </AdminCardHeader>
          <AdminCardContent className="space-y-6">
            {passengers.map((p, idx) => (
              <div key={idx} className="p-4 bg-[var(--color-surface-50)] border border-gray-200 rounded-sm relative group">
                {passengers.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemovePassenger(idx)}
                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border border-red-200 shadow-sm z-10"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
                <div className="mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 flex justify-between items-center">
                  <span>Passenger {idx + 1}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-1 lg:col-span-2">
                    <FormGroup label="Full Name (As in Passport)" required>
                      <AdminInput 
                        value={p.fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'fullName', e.target.value)}
                        required
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup label="Gender">
                      <AdminSelect 
                        value={p.gender as string}
                        onChange={(val: string) => handlePassengerChange(idx, 'gender', val)}
                        options={[
                          { value: 'M', label: 'M - Male' },
                          { value: 'F', label: 'F - Female' }
                        ]}
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup label="Age">
                      <AdminInput 
                        type="number"
                        value={p.age}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'age', Number(e.target.value))}
                      />
                    </FormGroup>
                  </div>

                  <div>
                    <FormGroup label="Place of Birth">
                      <AdminInput 
                        value={p.placeOfBirth as string || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'placeOfBirth', e.target.value)}
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup label="Date of Birth">
                      <AdminInput 
                        type="date"
                        value={p.dateOfBirth as string || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'dateOfBirth', e.target.value)}
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup label="Nationality">
                      <AdminInput 
                        value={p.nationality}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'nationality', e.target.value)}
                      />
                    </FormGroup>
                  </div>

                  <div>
                    <FormGroup label="Dietary Restrictions">
                      <AdminSelect 
                        value={p.dietaryRequirements as string || 'None'}
                        onChange={(val: string) => handlePassengerChange(idx, 'dietaryRequirements', val)}
                        options={[
                          { value: 'None', label: 'None' },
                          { value: 'Vegetarian', label: 'Vegetarian' },
                          { value: 'Vegan', label: 'Vegan' },
                          { value: 'Halal', label: 'Halal' },
                          { value: 'Gluten-Free', label: 'Gluten-Free' }
                        ]}
                      />
                    </FormGroup>
                  </div>
                  
                  <div className="md:col-span-1 lg:col-span-2">
                    <FormGroup label="Passport / ID Number">
                      <AdminInput 
                        value={p.passportNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                      />
                    </FormGroup>
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-2">
                    <FormGroup label="Upload Document">
                      <div className="relative h-10 w-full mt-1"> 
                        <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(idx, e)} className="hidden" id={`passport-upload-${idx}`} />
                        <label htmlFor={`passport-upload-${idx}`} className={`flex items-center justify-center gap-2 h-full rounded-sm border cursor-pointer transition-all text-[10px] font-bold uppercase tracking-widest ${uploadingState[idx] ? 'border-[var(--color-gold-500)] bg-[var(--color-gold-50)] text-[var(--color-gold-600)]' : p.passportFileUrl ? 'border-green-500 bg-green-50 text-green-700 shadow-inner' : 'border-gray-300 hover:border-[var(--color-navy-800)] bg-white text-[var(--color-navy-900)]'}`}>
                          {uploadingState[idx] ? (<><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>) : p.passportFileUrl ? (<><CheckCircle2 className="w-3 h-3" /> Attached</>) : (<><UploadCloud className="w-3 h-3 text-gray-500" /> Upload File</>)}
                        </label>
                      </div>
                    </FormGroup>
                  </div>
                </div>
              </div>
            ))}
          </AdminCardContent>
        </AdminCard>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <AdminButton type="submit" size="lg" isLoading={isLoading} className="w-full md:w-auto px-10 text-xs tracking-widest">
            <Save className="w-4 h-4 mr-2" /> SAVE BOOKING
          </AdminButton>
        </div>

      </form>
    </div>
  );
}
