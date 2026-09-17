"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Search, Eye, CheckCircle2, 
  AlertCircle, Clock, XCircle 
} from 'lucide-react';

import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { AdminInput } from '@/components/admin/ui/AdminInput';

type BookingStatus = 'PENDING' | 'WAITING_VERIFICATION' | 'PAID' | 'CANCELLED';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time listener using onSnapshot
  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching bookings real-time:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PAID':
        return <AdminBadge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Secured</AdminBadge>;
      case 'WAITING_VERIFICATION':
        return <AdminBadge variant="warning" className="gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> Verify Remittance</AdminBadge>;
      case 'PENDING':
        return <AdminBadge variant="default" className="gap-1"><Clock className="w-3 h-3" /> Awaiting Fund</AdminBadge>;
      case 'CANCELLED':
        return <AdminBadge variant="danger" className="gap-1"><XCircle className="w-3 h-3" /> Terminated</AdminBadge>;
      default:
        return <AdminBadge variant="outline">{status}</AdminBadge>;
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchSearch = (b.bookingId || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (b.contactEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const tableHeaders = [
    "Reference No.",
    "Guest Contact",
    "Sailing Date",
    "Invoice Total",
    "Clearance Status",
    "Action"
  ];

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Master Registry</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time surveillance of all maritime reservations.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-sm border border-gray-200/60 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar">
          {['ALL', 'WAITING_VERIFICATION', 'PAID', 'PENDING', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                filterStatus === status 
                  ? 'bg-[var(--color-navy-900)] text-white shadow-md' 
                  : 'bg-[var(--color-surface-50)] text-gray-500 hover:bg-gray-100'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full lg:w-80">
          <AdminInput 
            leftIcon={<Search className="w-4 h-4" />}
            type="text" 
            placeholder="Search Reference or Email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Registry Table */}
      <AdminTable headers={tableHeaders} isLoading={isLoading}>
        {filteredBookings.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
              No reservations found matching current parameters.
            </td>
          </tr>
        ) : (
          filteredBookings.map((b) => (
            <tr key={b.id} className="hover:bg-[var(--color-surface-50)] transition-colors group">
              <td className="px-6 py-4">
                <div className="font-mono text-xs font-bold text-[var(--color-navy-900)]">{b.bookingId}</div>
                <div className="text-[10px] text-gray-400 mt-1">{new Date(b.createdAt).toLocaleDateString('id-ID')}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs font-medium text-[var(--color-navy-900)] truncate max-w-[200px]">{b.contactEmail}</div>
                <div className="text-[10px] text-gray-500 mt-1">{b.contactPhone}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs font-medium text-[var(--color-navy-900)]">
                  {new Date(b.dateOfDeparture).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase">{b.cabinClass} ({b.paxCount} Pax)</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-serif text-[var(--color-navy-900)]">IDR {b.totalAmount?.toLocaleString('id-ID')}</div>
                <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{b.paymentMethod?.replace('_', ' ')}</div>
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(b.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <Link 
                  href={`/admin/bookings/${b.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-white border border-gray-200 text-gray-500 hover:text-[var(--color-gold-600)] hover:border-[var(--color-gold-400)] shadow-sm transition-all"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </td>
            </tr>
          ))
        )}
      </AdminTable>
    </div>
  );
}
