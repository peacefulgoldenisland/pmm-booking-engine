"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Save, Calendar, Ship } from 'lucide-react';
import Link from 'next/link';

import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import type { MasterCabin, VoyageSchedule } from '@/types/voyage';

export default function NewSchedulePage() {
  const router = useRouter();
  
  const [isLoadingCabins, setIsLoadingCabins] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cabins, setCabins] = useState<MasterCabin[]>([]);
  
  const [formData, setFormData] = useState({
    dateStr: '',
    shipName: 'PMM Phinisi',
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCabins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const loadedCabins = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MasterCabin[];
        setCabins(loadedCabins);
      } catch (error) {
        console.error("Error fetching master cabins:", error);
      } finally {
        setIsLoadingCabins(false);
      }
    };
    fetchCabins();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dateStr || !formData.shipName) return;
    
    // Validate Saturday
    const selectedDate = new Date(formData.dateStr);
    if (selectedDate.getDay() !== 6) {
      setErrorMsg('Departures must be scheduled on a Saturday.');
      return;
    }

    if (cabins.length === 0) {
      setErrorMsg('No cabins found. Please create cabins first.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build quotas mapping: cabin.id -> maxCapacity
      const quotas: Record<string, number> = {};
      let totalCapacity = 0;
      cabins.forEach(cabin => {
        quotas[cabin.id] = cabin.maxCapacity || 0;
        totalCapacity += cabin.maxCapacity || 0;
      });

      const scheduleData: Partial<VoyageSchedule> = {
        departureDate: formData.dateStr,
        shipName: formData.shipName,
        status: 'SCHEDULED',
        cabinQuotas: quotas,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any
      };

      // ID format: YYYY-MM-DD
      const docId = formData.dateStr;
      
      await setDoc(doc(db, 'voyages', docId), scheduleData);
      
      router.push('/admin/voyages');
    } catch (error) {
      console.error("Error generating schedule:", error);
      setErrorMsg('Failed to generate schedule. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/voyages">
          <button className="w-10 h-10 bg-white border border-gray-200 rounded-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-[var(--color-navy-900)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Generate Schedule</h1>
          <p className="text-xs text-gray-500 mt-1">Create a new trip schedule.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AdminCard>
          <AdminCardContent className="p-8 space-y-6">
            
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 text-sm border border-red-100 rounded-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-gold-500)]" />
                  Departure Date (Saturday)
                </label>
                <AdminInput 
                  name="dateStr" 
                  type="date"
                  value={formData.dateStr} 
                  onChange={handleInputChange} 
                  required 
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Only select Saturdays.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Ship className="w-4 h-4 text-[var(--color-gold-500)]" />
                  Fleet / Ship Name
                </label>
                <AdminInput 
                  name="shipName" 
                  type="text"
                  value={formData.shipName} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <label className="block text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest mb-4">
                Automatic Capacity Allocation
              </label>
              
              {isLoadingCabins ? (
                <div className="text-sm text-gray-400">Loading cabins...</div>
              ) : cabins.length === 0 ? (
                <div className="text-sm text-red-500">Warning: No cabins configured in the system.</div>
              ) : (
                <div className="bg-gray-50 rounded-sm border border-gray-100 p-4 space-y-3">
                  {cabins.map(cabin => (
                    <div key={cabin.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-[var(--color-navy-900)]">{cabin.name}</span>
                      <span className="text-gray-500">{cabin.maxCapacity} Pax Quota</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-[var(--color-navy-900)]">
                    <span>Total Ship Capacity</span>
                    <span>{cabins.reduce((acc, curr) => acc + (curr.maxCapacity || 0), 0)} Pax</span>
                  </div>
                </div>
              )}
            </div>

          </AdminCardContent>
        </AdminCard>

        <div className="mt-6 flex justify-end">
          <AdminButton 
            type="submit" 
            variant="primary" 
            className="w-full md:w-auto shadow-luxury !py-4 px-8"
            disabled={isSubmitting || isLoadingCabins || cabins.length === 0}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Schedule</>
            )}
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
