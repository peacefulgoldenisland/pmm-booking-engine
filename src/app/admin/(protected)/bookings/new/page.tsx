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
import { AdminDatePicker } from '@/components/admin/ui/AdminDatePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';
import type { VoyageSchedule, MasterCabin } from '@/types/voyage';
import type { Passenger, BookingSource } from '@/types/booking';
import type { TravelAgent } from '@/app/admin/(protected)/users/agents/page';
import { logAuditTrail } from '@/lib/auditLogger';
import { useAuthStore } from '@/store/useAuthStore';

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
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // Reference Data
  const [voyages, setVoyages] = useState<VoyageSchedule[]>([]);
  const [cabins, setCabins] = useState<MasterCabin[]>([]);
  const [agents, setAgents] = useState<TravelAgent[]>([]);

  // Form State - Itinerary
  const [voyageId, setVoyageId] = useState('');
  const [cabinId, setCabinId] = useState('');
  const [bookedUnits, setBookedUnits] = useState<number>(1);
  
  // Form State - Source & Pricing
  const [source, setSource] = useState<BookingSource>('AGENT');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [basePricePerPax, setBasePricePerPax] = useState<number | ''>('');
  const [discountPerPax, setDiscountPerPax] = useState<number | ''>(900000);

  // Derived Total
  const netTotal = (Number(basePricePerPax || 0) - Number(discountPerPax || 0)) * bookedUnits;

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
        const [voyageSnap, cabinSnap, agentSnap] = await Promise.all([
          getDocs(collection(db, 'voyages')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'agents'))
        ]);
        
        const fetchedVoyages = voyageSnap.docs.map(d => ({ id: d.id, ...d.data() } as VoyageSchedule));
        const fetchedCabins = cabinSnap.docs.map(d => ({ id: d.id, ...d.data() } as MasterCabin));
        const fetchedAgents = agentSnap.docs.map(d => ({ id: d.id, ...d.data() } as TravelAgent));
        
        setVoyages(fetchedVoyages.sort((a, b) => a.id.localeCompare(b.id)));
        setCabins(fetchedCabins);
        setAgents(fetchedAgents.sort((a, b) => a.name.localeCompare(b.name)));
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
    
    if (field === 'dateOfBirth' && typeof value === 'string' && value) {
      const dob = new Date(value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        calculatedAge--;
      }
      updated[index].age = Math.max(0, calculatedAge);
    }
    
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
      if (!voyageId || !cabinId || !basePricePerPax) {
        throw new Error("Please complete Voyage, Cabin, and Base Price fields.");
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
          basePrice: Number(basePricePerPax) * passengers.length,
          discountAmount: Number(discountPerPax) * passengers.length,
          totalAmount: netTotal,
          paymentMethod: 'OFFLINE',
          createdAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          recordedBy: adminUser?.email || 'Admin',
        };

        const bookingRef = doc(collection(db, 'bookings'), generatedBookingId);
        transaction.set(bookingRef, bookingData);
      });

      await logAuditTrail({
        action: 'CREATE_BOOKING',
        module: 'Bookings',
        targetId: generatedBookingId,
        details: `Manually created booking for ${generatedBookingId}`,
        actor: currentUser
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: BOOKING SOURCE & LEAD CONTACT */}
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <span className="w-6 h-6 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center text-xs font-bold">1</span>
              Booking Source & Lead Contact
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-sm border border-gray-100">
              <FormGroup label="Booking Source" required>
                <AdminSelect 
                  value={source} 
                  onChange={(val: string) => {
                    setSource(val as BookingSource);
                    if (val === 'OFFICE') {
                      setDiscountPerPax(0);
                      setLeadEmail(currentUser?.email || '');
                      setLeadPhone(currentUser?.phone || '');
                    } else {
                      setDiscountPerPax(900000);
                      setLeadEmail('');
                      setLeadPhone('');
                      setPickupLocation('');
                      setSelectedAgentId('');
                      setAgentName('');
                    }
                  }}
                  options={[
                    { value: 'AGENT', label: 'Travel Agent' },
                    { value: 'OFFICE', label: 'Internal Office (Walk-in)' }
                  ]}
                />
              </FormGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {source === 'AGENT' && (
                <FormGroup label="Select Registered Agent" required>
                  <AdminSelect 
                    value={selectedAgentId}
                    onChange={(val: string) => {
                      setSelectedAgentId(val);
                      const agent = agents.find(a => a.id === val);
                      if (agent) {
                        setAgentName(agent.name);
                        setLeadEmail(agent.email || '');
                        setLeadPhone(agent.phone || '');
                        setPickupLocation(agent.defaultPickupLocation || '');
                        setDiscountPerPax(agent.defaultDiscount || 0);
                      }
                    }}
                    placeholder="Choose an agent..."
                    options={agents.map(a => ({ value: a.id, label: `${a.name} ${a.companyName ? `(${a.companyName})` : ''}` }))}
                  />
                </FormGroup>
              )}

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

        {/* STEP 2: ITINERARY & PRICING */}
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center gap-2 text-[var(--color-navy-900)]">
              <span className="w-6 h-6 rounded-full bg-[var(--color-gold-500)] text-white flex items-center justify-center text-xs font-bold">2</span>
              Trip Itinerary & Pricing
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Trip Schedule (Date) <span className="text-red-500">*</span>
                 </label>
                 <AdminDatePicker 
                   value={voyageId}
                   onChange={(val: string) => setVoyageId(val)}
                   placeholder="Select Saturday"
                   filterDate={(date: Date) => date.getDay() === 6}
                 />
              </div>
              
              <FormGroup label="Cabin Assigned" required>
                <AdminSelect 
                  value={cabinId} 
                  onChange={(val: string) => {
                    setCabinId(val);
                    const selectedCabin = cabins.find(c => c.id === val);
                    if (selectedCabin && selectedCabin.price) {
                      setBasePricePerPax(selectedCabin.price);
                    }
                  }}
                  placeholder="Select Cabin"
                  options={cabins.map(c => ({ value: c.id, label: c.name }))}
                />
              </FormGroup>

              <FormGroup label="Units Booked (Pax Count)" required>
                <AdminInput 
                  type="number" 
                  min={1}
                  value={bookedUnits} 
                  onChange={(e) => {
                     const units = parseInt(e.target.value) || 1;
                     setBookedUnits(units);
                     // Auto sync passenger manifest length
                     if (units > passengers.length) {
                       const diff = units - passengers.length;
                       setPassengers([...passengers, ...Array(diff).fill({ fullName: '', gender: 'M', age: 30, passportNumber: '', nationality: '', placeOfBirth: '', dateOfBirth: '', dietaryRequirements: 'None', passportFileUrl: '' })]);
                     } else if (units < passengers.length) {
                       setPassengers(passengers.slice(0, units));
                     }
                  }} 
                  required 
                />
              </FormGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
              <FormGroup label="Base Price / Pax (IDR)" required>
                <AdminInput 
                  type="number"
                  value={basePricePerPax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasePricePerPax(e.target.value ? Number(e.target.value) : '')}
                  placeholder="4600000"
                  leftIcon={<CircleDollarSign className="w-4 h-4 text-gray-400" />}
                  required
                />
              </FormGroup>

              <FormGroup label={source === 'AGENT' ? "Agent Discount / Pax (IDR)" : "Office Discount / Pax (IDR)"}>
                <AdminInput 
                  type="number"
                  value={discountPerPax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountPerPax(e.target.value ? Number(e.target.value) : '')}
                  placeholder={source === 'AGENT' ? "900000" : "0"}
                  leftIcon={<Minus className="w-4 h-4 text-gray-400" />}
                  className="text-red-600 bg-red-50"
                />
              </FormGroup>

              <FormGroup label="Net Total (IDR)">
                <div className="flex items-center h-[42px] px-3 bg-[var(--color-navy-900)] text-white rounded-sm font-mono font-bold text-lg">
                  Rp {netTotal.toLocaleString('id-ID')}
                </div>
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
                    <FormGroup label="Date of Birth">
                      <AdminDatePicker 
                        value={p.dateOfBirth as string || ''}
                        onChange={(val: string) => handlePassengerChange(idx, 'dateOfBirth', val)}
                        placeholder="Select Date"
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
                  
                  <div className="md:col-span-1 lg:col-span-1">
                    <FormGroup label="Passport / ID Number">
                      <AdminInput 
                        value={p.passportNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                      />
                    </FormGroup>
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-4 mt-2">
                    <FormGroup label="Upload Document">
                      <div className="relative h-[42px] w-full mt-1"> 
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
