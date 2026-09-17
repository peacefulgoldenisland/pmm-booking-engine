"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Ship, UsersRound, CreditCard, TicketPercent, 
  ArrowRight, Loader2 
} from 'lucide-react';
import Link from 'next/link';

import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    totalBookings: 0,
    totalGuests: 0,
    activeVouchers: 0,
    revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch Bookings
        const bookingsRef = collection(db, 'bookings');
        const bookingsSnap = await getDocs(bookingsRef);
        
        let pending = 0;
        let totalRev = 0;
        bookingsSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'WAITING_VERIFICATION') pending++;
          if (data.status === 'PAID') totalRev += (data.totalAmount || 0);
        });

        // Fetch Guests
        const usersSnap = await getDocs(collection(db, 'users'));
        
        // Fetch Active Vouchers
        const vouchersRef = collection(db, 'promo_codes');
        const qVouchers = query(vouchersRef, where('status', '==', 'ACTIVE'));
        const vouchersSnap = await getDocs(qVouchers);

        setStats({
          pendingVerifications: pending,
          totalBookings: bookingsSnap.size,
          totalGuests: usersSnap.size,
          activeVouchers: vouchersSnap.size,
          revenue: totalRev,
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-gold-500)]" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Command Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">High-level overview of system metrics and pending actions.</p>
      </div>

      {/* Action Needed Alert */}
      {stats.pendingVerifications > 0 && (
        <AdminCard className="bg-amber-50 border-amber-200 mb-8">
          <AdminCardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-amber-700 font-bold font-mono">{stats.pendingVerifications}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">Verification Pending</h3>
                <p className="text-xs text-amber-700 mt-0.5">There are payments awaiting your clearance.</p>
              </div>
            </div>
            <Link href="/admin/bookings">
              <AdminButton variant="warning" className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-sm">
                Review Now
              </AdminButton>
            </Link>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Bookings */}
        <AdminCard className="hover:border-[var(--color-gold-300)] transition-all group">
          <AdminCardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center text-[var(--color-navy-900)]">
                <Ship className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-navy-900)] transition-colors" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total Reservations</p>
            <p className="text-3xl font-serif text-[var(--color-navy-900)]">{stats.totalBookings}</p>
          </AdminCardContent>
        </AdminCard>

        {/* Total Guests */}
        <AdminCard className="hover:border-[var(--color-gold-300)] transition-all group">
          <AdminCardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center text-[var(--color-navy-900)]">
                <UsersRound className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-navy-900)] transition-colors" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Registered Guests</p>
            <p className="text-3xl font-serif text-[var(--color-navy-900)]">{stats.totalGuests}</p>
          </AdminCardContent>
        </AdminCard>

        {/* Active Promos */}
        <AdminCard className="hover:border-[var(--color-gold-300)] transition-all group">
          <AdminCardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center text-[var(--color-navy-900)]">
                <TicketPercent className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-navy-900)] transition-colors" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Active Promos</p>
            <p className="text-3xl font-serif text-[var(--color-navy-900)]">{stats.activeVouchers}</p>
          </AdminCardContent>
        </AdminCard>

        {/* Secured Revenue */}
        <AdminCard className="bg-[var(--color-navy-900)] border-[var(--color-gold-500)]/20 shadow-luxury group">
          <AdminCardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--color-gold-500)]">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-[var(--color-gold-400)] uppercase tracking-widest mb-1">Secured Revenue</p>
            <div className="flex items-end gap-1">
              <span className="text-sm text-gray-400 mb-1">IDR</span>
              <p className="text-2xl font-serif text-white">{stats.revenue.toLocaleString('id-ID')}</p>
            </div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Quick Links Menu */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Quick Navigation</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <Link href="/admin/bookings" className="bg-white border border-gray-200 p-4 rounded-sm flex items-center justify-between hover:bg-[var(--color-surface-50)] transition-colors group">
          <div className="flex items-center gap-3">
            <Ship className="w-5 h-5 text-[var(--color-gold-500)]" />
            <span className="text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest">Master Registry</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-navy-900)] transition-colors" />
        </Link>

        <Link href="/admin/guests" className="bg-white border border-gray-200 p-4 rounded-sm flex items-center justify-between hover:bg-[var(--color-surface-50)] transition-colors group">
          <div className="flex items-center gap-3">
            <UsersRound className="w-5 h-5 text-[var(--color-gold-500)]" />
            <span className="text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest">Guest Directory</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-navy-900)] transition-colors" />
        </Link>

        <Link href="/admin/vouchers" className="bg-white border border-gray-200 p-4 rounded-sm flex items-center justify-between hover:bg-[var(--color-surface-50)] transition-colors group">
          <div className="flex items-center gap-3">
            <TicketPercent className="w-5 h-5 text-[var(--color-gold-500)]" />
            <span className="text-xs font-bold text-[var(--color-navy-900)] uppercase tracking-widest">Vouchers</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-navy-900)] transition-colors" />
        </Link>

      </div>

    </div>
  );
}
