"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Plus, CalendarDays, BedDouble, Search, Anchor, 
  Edit, Info
} from 'lucide-react';

import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import type { MasterCabin, VoyageSchedule } from '@/types/voyage';

type TabState = 'CABINS' | 'SCHEDULES';

export default function AdminVoyagesPage() {
  const [activeTab, setActiveTab] = useState<TabState>('CABINS');
  const [cabins, setCabins] = useState<MasterCabin[]>([]);
  const [schedules, setSchedules] = useState<VoyageSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    
    // Fetch Master Cabins
    const qCabins = query(collection(db, 'products'), orderBy('price', 'desc'));
    const unsubCabins = onSnapshot(qCabins, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MasterCabin[];
      setCabins(data);
      if (activeTab === 'CABINS') setIsLoading(false);
    });

    // Fetch Schedules
    const qSchedules = query(collection(db, 'voyages'), orderBy('departureDate', 'asc'));
    const unsubSchedules = onSnapshot(qSchedules, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VoyageSchedule[];
      setSchedules(data);
      if (activeTab === 'SCHEDULES') setIsLoading(false);
    });

    return () => {
      unsubCabins();
      unsubSchedules();
    };
  }, [activeTab]);

  const filteredCabins = cabins.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSchedules = schedules.filter(s => s.id?.includes(searchQuery));

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Trips & Schedules</h1>
          <p className="text-xs text-gray-500 mt-1">Manage cabins and generate weekly trip schedules.</p>
        </div>
        
        {/* Dynamic Header Action Button */}
        {activeTab === 'CABINS' ? (
          <Link href="/admin/voyages/cabins/new">
            <AdminButton variant="primary" className="shadow-luxury">
              <Plus className="w-4 h-4 mr-2" /> Add New Cabin
            </AdminButton>
          </Link>
        ) : (
          <Link href="/admin/voyages/schedules/new">
            <AdminButton variant="primary" className="shadow-luxury">
              <Plus className="w-4 h-4 mr-2" /> Generate Schedule
            </AdminButton>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => { setActiveTab('CABINS'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors ${
            activeTab === 'CABINS' 
              ? 'border-[var(--color-gold-500)] text-[var(--color-navy-900)]' 
              : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BedDouble className="w-4 h-4" /> Cabins
        </button>
        <button 
          onClick={() => { setActiveTab('SCHEDULES'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors ${
            activeTab === 'SCHEDULES' 
              ? 'border-[var(--color-gold-500)] text-[var(--color-navy-900)]' 
              : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Schedules
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-sm border border-gray-200/60 shadow-sm mb-6 flex items-center justify-end">
        <div className="w-full md:w-96">
          <AdminInput 
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            type="text" 
            placeholder={activeTab === 'CABINS' ? "Search cabin name..." : "Search by Date (YYYY-MM-DD)..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TAB CONTENT: CABINS */}
      {activeTab === 'CABINS' && (
        isLoading ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
            <p className="text-gray-400 text-sm">Loading cabins...</p>
          </div>
        ) : filteredCabins.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
            <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-4">No cabins defined in the fleet yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCabins.map(cabin => (
              <AdminCard key={cabin.id} className="p-0 overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-shadow">
                <div className="w-full md:w-48 h-48 md:h-full bg-gray-100 shrink-0 relative">
                  {cabin.images && cabin.images.length > 0 ? (
                    <img src={cabin.images[0]} alt={cabin.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><BedDouble className="w-8 h-8" /></div>
                  )}
                  {cabin.popular && (
                    <div className="absolute top-2 left-2 bg-[var(--color-gold-500)] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm">
                      Popular
                    </div>
                  )}
                </div>
                <AdminCardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-serif text-[var(--color-navy-900)] group-hover:text-[var(--color-gold-600)] transition-colors line-clamp-1">{cabin.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cabin.description}</p>
                    
                    <div className="flex gap-4 mt-4 border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Price / Cabin</p>
                        <p className="text-sm font-bold text-[var(--color-navy-900)]">IDR {Number(cabin.price).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Capacity</p>
                        <p className="text-sm font-bold text-[var(--color-navy-900)]">{cabin.maxCapacity} Pax</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <Link href={`/admin/voyages/cabins/edit/${cabin.id}`}>
                      <AdminButton variant="outline" className="text-xs py-1.5"><Edit className="w-3 h-3 mr-1" /> Edit</AdminButton>
                    </Link>
                  </div>
                </AdminCardContent>
              </AdminCard>
            ))}
          </div>
        )
      )}

      {/* TAB CONTENT: SCHEDULES */}
      {activeTab === 'SCHEDULES' && (
        isLoading ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
            <p className="text-gray-400 text-sm">Loading schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-4">No schedules generated yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-50)] border-b border-gray-200">
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Departure Date</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ship Name</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available Cabins</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule) => {
                  const totalCabins = Object.values(schedule.cabinQuotas || {}).reduce((sum, current) => sum + current, 0);
                  const isPast = new Date(schedule.id) < new Date();
                  
                  return (
                    <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm font-bold text-[var(--color-navy-900)]">{schedule.id}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(schedule.id).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-gray-400" /> {schedule.shipName}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700">
                        {totalCabins} Available
                      </td>
                      <td className="p-4">
                        <AdminBadge variant={schedule.status === 'SCHEDULED' && !isPast ? 'success' : schedule.status === 'CANCELLED' ? 'danger' : 'default'}>
                          {isPast ? 'COMPLETED' : schedule.status}
                        </AdminBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
