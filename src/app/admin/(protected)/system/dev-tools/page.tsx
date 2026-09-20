"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { Wrench, Database, Loader2, AlertTriangle } from 'lucide-react';
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';

export default function DevToolsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSeedBookings = async () => {
    if (!confirm("WARNING: This will generate 10 dummy bookings for testing purposes. Are you sure you want to proceed?")) return;
    
    setIsLoading(true);
    try {
      const promises = [];
      for(let i = 0; i < 10; i++) {
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
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)] flex items-center gap-3">
            <Wrench className="w-6 h-6 text-[var(--color-gold-500)]" />
            System / Dev Tools
          </h1>
          <p className="text-gray-500 text-sm mt-1">Advanced system utilities and database operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard className="border-l-4 border-amber-500">
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center gap-2 text-amber-700 text-sm">
              <Database className="w-4 h-4" /> Database Seeding
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <p className="text-xs text-gray-500 mb-6">
              Generate dummy bookings to test manifest exports and UI layouts. This will inject data directly into the active Firestore database.
            </p>
            
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-sm flex items-start gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Caution:</strong> Do not use this in a production environment with real customers, as it may pollute analytics.
              </div>
            </div>

            <AdminButton 
              variant="warning" 
              onClick={handleSeedBookings} 
              isLoading={isLoading}
              className="w-full"
            >
              Seed 10 Test Bookings
            </AdminButton>
          </AdminCardContent>
        </AdminCard>
      </div>
    </div>
  );
}
