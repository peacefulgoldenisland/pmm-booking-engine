"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Plus, CalendarDays, BedDouble, Search, Anchor, 
  Edit, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Trips & Schedules</h1>
          <p className="text-xs text-gray-500 mt-1">Manage cabins and generate weekly trip schedules.</p>
        </div>
        
        {/* Header Action Button (Desktop Only) */}
        <div className="hidden md:block w-full md:w-auto mt-2 md:mt-0">
          {activeTab === 'CABINS' ? (
            <Link href="/admin/voyages/cabins/new" className="block w-full">
              <AdminButton variant="primary" className="shadow-luxury w-full md:w-auto py-3 md:py-2">
                <Plus className="w-4 h-4 mr-2" /> Add New Cabin
              </AdminButton>
            </Link>
          ) : (
            <Link href="/admin/voyages/schedules/new" className="block w-full">
              <AdminButton variant="primary" className="shadow-luxury w-full md:w-auto py-3 md:py-2">
                <Plus className="w-4 h-4 mr-2" /> Generate Schedule
              </AdminButton>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-[80px] right-4 z-40">
        <Link 
          href={activeTab === 'CABINS' ? "/admin/voyages/cabins/new" : "/admin/voyages/schedules/new"} 
          className="flex items-center justify-center w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-sm shadow-[0_8px_16px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* Mobile Control Bar (Tabs + Search) */}
      <div className="md:static -mx-4 md:mx-0 px-4 md:px-0 py-2 md:py-0 bg-white/90 md:bg-transparent md:backdrop-blur-none border-b border-gray-100 md:border-none mb-6">
        {/* Native Mobile Segmented Control for Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-sm mb-4 md:bg-transparent md:p-0 md:rounded-none md:border-b md:border-gray-200 md:mb-6">
          <button 
            onClick={() => { setActiveTab('CABINS'); setSearchQuery(''); }}
            className={cn(
              "flex-1 flex justify-center items-center gap-2 py-2.5 md:py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-md md:rounded-none md:border-b-2",
              activeTab === 'CABINS' 
                ? "bg-white text-[var(--color-navy-900)] shadow-sm md:bg-transparent md:shadow-none md:border-[var(--color-gold-500)]" 
                : "text-gray-500 md:text-gray-400 hover:text-gray-700 md:border-transparent md:hover:border-gray-300"
            )}
          >
            <BedDouble className="w-4 h-4" /> Cabins
          </button>
          <button 
            onClick={() => { setActiveTab('SCHEDULES'); setSearchQuery(''); }}
            className={cn(
              "flex-1 flex justify-center items-center gap-2 py-2.5 md:py-4 text-xs font-bold uppercase tracking-widest transition-all rounded-md md:rounded-none md:border-b-2",
              activeTab === 'SCHEDULES' 
                ? "bg-white text-[var(--color-navy-900)] shadow-sm md:bg-transparent md:shadow-none md:border-[var(--color-gold-500)]" 
                : "text-gray-500 md:text-gray-400 hover:text-gray-700 md:border-transparent md:hover:border-gray-300"
            )}
          >
            <CalendarDays className="w-4 h-4" /> Schedules
          </button>
        </div>

        {/* Control Panel / Search Bar */}
        <div className="bg-white md:p-4 md:rounded-sm md:border md:border-gray-200/60 md:shadow-sm flex items-center justify-end">
          <div className="w-full md:w-96">
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 flex items-center justify-center text-gray-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder={activeTab === 'CABINS' ? "Search cabin name..." : "Search by Date (YYYY-MM-DD)..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 md:bg-white border-transparent md:border-gray-200 focus:border-[var(--color-navy-900)] focus:bg-white focus:ring-0 rounded-sm text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-6">
            {filteredCabins.map(cabin => (
              <div key={cabin.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col md:flex-row group shadow-sm hover:shadow-md transition-shadow">
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
                <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
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
                    <Link href={`/admin/voyages/cabins/edit/${cabin.id}`} className="w-full md:w-auto">
                      <AdminButton variant="outline" className="w-full text-xs py-2 md:py-1.5"><Edit className="w-3 h-3 mr-1" /> Edit Cabin</AdminButton>
                    </Link>
                  </div>
                </div>
              </div>
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
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-sm overflow-x-auto">
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

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3 min-h-[50vh]">
              {filteredSchedules.map((schedule) => {
                const totalCabins = Object.values(schedule.cabinQuotas || {}).reduce((sum, current) => sum + current, 0);
                const isPast = new Date(schedule.id) < new Date();
                
                return (
                  <div key={schedule.id} className="bg-white rounded-sm border border-gray-200 p-4 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-mono text-[11px] font-bold text-[var(--color-navy-900)] bg-gray-200/50 px-1.5 py-0.5 rounded-sm inline-block mb-1.5">{schedule.id}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {new Date(schedule.id).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="scale-90 origin-top-right">
                        <AdminBadge variant={schedule.status === 'SCHEDULED' && !isPast ? 'success' : schedule.status === 'CANCELLED' ? 'danger' : 'default'}>
                          {isPast ? 'COMPLETED' : schedule.status}
                        </AdminBadge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-[var(--color-navy-900)]">
                      <Anchor className="w-3.5 h-3.5 text-[var(--color-gold-500)]" /> {schedule.shipName}
                    </div>

                    <div className="pt-3 border-t border-gray-200/50 flex justify-between items-end">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Available Quota</p>
                        <p className="text-sm font-bold text-[var(--color-navy-900)]">{totalCabins} Cabins</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-[80px] right-4 z-40">
        {activeTab === 'CABINS' ? (
          <Link href="/admin/voyages/cabins/new" className="flex items-center justify-center w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-full shadow-[0_8px_16px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" />
          </Link>
        ) : (
          <Link href="/admin/voyages/schedules/new" className="flex items-center justify-center w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-full shadow-[0_8px_16px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" />
          </Link>
        )}
      </div>
    </div>
  );
}
