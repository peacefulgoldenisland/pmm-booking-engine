"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Search, Plus, Ticket, Calendar, Percent, 
  CircleDollarSign, CheckCircle2, XCircle
} from 'lucide-react';

import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardContent } from '@/components/admin/ui/AdminCard';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import type { Voucher } from '@/types/voucher';

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Note: We use 'promo_codes' collection for globally managed vouchers
    const q = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Voucher[];
      setVouchers(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching vouchers:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredVouchers = vouchers.filter(v => {
    return (v.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (v.name || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="pb-20">
      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-[80px] right-4 z-40">
        <Link href="/admin/vouchers/create" className="flex items-center justify-center w-14 h-14 bg-[var(--color-gold-500)] text-[var(--color-navy-900)] rounded-sm shadow-[0_8px_16px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* Mobile Page Header */}
      <div className="md:hidden mb-4 mt-2">
        <h1 className="text-3xl font-serif text-[var(--color-navy-900)] mb-1">Vouchers</h1>
        <p className="text-xs text-gray-500">
          Showing {filteredVouchers.length} {filteredVouchers.length === 1 ? 'promo code' : 'promo codes'}.
        </p>
      </div>

      {/* Desktop Page Header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Voucher & Promo</h1>
          <p className="text-xs text-gray-500 mt-1">Manage discount codes and promotions.</p>
        </div>
        <Link href="/admin/vouchers/create">
          <AdminButton variant="primary" className="shadow-luxury">
            <Plus className="w-4 h-4 mr-2" /> Create New Voucher
          </AdminButton>
        </Link>
      </div>

      {/* Control Panel (Search on Mobile) */}
      <div className="md:static md:bg-white md:p-4 md:rounded-sm md:border md:border-gray-200/60 md:shadow-sm py-3 md:py-0 mb-6 flex items-center justify-end -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Voucher Code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200/80 md:border-none rounded-sm pl-11 pr-4 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-400)] shadow-sm font-medium text-[var(--color-navy-900)] placeholder:text-gray-400 transition-shadow"
          />
        </div>
      </div>

      {/* Vouchers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-100 shadow-sm animate-pulse flex flex-col overflow-hidden">
              <div className="h-2 w-full bg-gray-200 shrink-0" />
              <div className="p-6 flex flex-col justify-between flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-32 h-6 bg-gray-200 rounded-sm mb-2" />
                  <div className="w-6 h-6 bg-gray-200 rounded-sm" />
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="h-4 bg-gray-200 rounded-sm w-1/2" />
                  <div className="h-4 bg-gray-200 rounded-sm w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white rounded-sm border border-gray-100 p-8 text-center text-gray-500 text-sm shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-medium text-gray-600">No vouchers found</p>
          <p className="text-xs text-gray-400 mt-1 mb-6">Create a new promo code to get started.</p>
          <Link href="/admin/vouchers/create" className="hidden md:block">
            <AdminButton variant="outline">Create Voucher</AdminButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredVouchers.map((voucher) => {
            const validDate = voucher.validUntil 
              ? new Date(
                  typeof voucher.validUntil === 'string' || typeof voucher.validUntil === 'number' 
                    ? voucher.validUntil 
                    : (voucher.validUntil as any).toDate?.() || new Date()
                )
              : new Date();
            const isExpired = validDate < new Date();
            const isActive = voucher.status === 'ACTIVE' && !isExpired;
            
            return (
              <AdminCard key={voucher.id} className="hover:shadow-md hover:border-[var(--color-gold-300)] transition-all overflow-hidden flex flex-col group p-0">
                <div className={`h-2 w-full shrink-0 ${isActive ? 'bg-[var(--color-gold-500)]' : 'bg-gray-300'}`} />
                <AdminCardContent className="p-5 md:p-6 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-mono text-xl font-bold text-[var(--color-navy-900)] tracking-wider group-hover:text-[var(--color-gold-600)] transition-colors">{voucher.code}</h3>
                        <p className="text-xs text-gray-500 mt-1">{voucher.name}</p>
                      </div>
                      {isActive ? (
                        <span className="bg-green-50 text-green-700 p-1.5 rounded-sm"><CheckCircle2 className="w-4 h-4" /></span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 p-1.5 rounded-sm"><XCircle className="w-4 h-4" /></span>
                      )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center shrink-0">
                          {voucher.discountType === 'PERCENTAGE' ? <Percent className="w-3 h-3 text-[var(--color-navy-900)]" /> : <CircleDollarSign className="w-3 h-3 text-[var(--color-navy-900)]" />}
                        </div>
                        <p className="text-xs font-medium text-[var(--color-navy-900)]">
                          {voucher.discountType === 'PERCENTAGE' 
                            ? `${voucher.discountValue}% Off` 
                            : `IDR ${Number(voucher.discountValue).toLocaleString('id-ID')} Off`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-50)] flex items-center justify-center shrink-0">
                          <Calendar className="w-3 h-3 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500">
                          Valid til {voucher.validUntil 
                            ? new Date(
                                typeof voucher.validUntil === 'string' || typeof voucher.validUntil === 'number' 
                                  ? voucher.validUntil 
                                  : (voucher.validUntil as any).toDate?.() || new Date()
                              ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                          <CircleDollarSign className="w-3 h-3 text-red-500" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-red-600">
                          Min. IDR {Number(voucher.minTransaction || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </AdminCardContent>
                
                <div className="bg-[var(--color-surface-50)] p-4 border-t border-gray-100 flex justify-between items-center shrink-0">
                  <AdminBadge variant={isActive ? 'success' : 'default'}>
                    {isActive ? 'ACTIVE' : (isExpired ? 'EXPIRED' : 'INACTIVE')}
                  </AdminBadge>
                  <span className="text-[10px] text-gray-400 font-medium">Used: {voucher.usageCount || 0} times</span>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
