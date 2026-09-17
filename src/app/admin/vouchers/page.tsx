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

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Note: We use 'promo_codes' collection for globally managed vouchers
    const q = query(collection(db, 'promo_codes'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Voucher & Promo</h1>
          <p className="text-xs text-gray-500 mt-1">Manage discount codes and promotional campaigns.</p>
        </div>
        <Link href="/admin/vouchers/create">
          <AdminButton variant="primary" className="shadow-luxury">
            <Plus className="w-4 h-4 mr-2" /> Create New Promo
          </AdminButton>
        </Link>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-sm border border-gray-200/60 shadow-sm mb-6 flex items-center justify-end">
        <div className="w-full md:w-96">
          <AdminInput 
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            type="text" 
            placeholder="Search by Promo Code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Vouchers Grid */}
      {isLoading ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
          <p className="text-gray-400 text-sm">Loading promotional campaigns...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-sm">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-4">No promotional codes active at the moment.</p>
          <Link href="/admin/vouchers/create">
            <AdminButton variant="outline">Create First Promo</AdminButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const isExpired = new Date(voucher.validUntil) < new Date();
            const isActive = voucher.status === 'ACTIVE' && !isExpired;
            
            return (
              <AdminCard key={voucher.id} className="hover:shadow-md hover:border-[var(--color-gold-300)] transition-all overflow-hidden flex flex-col group p-0">
                <div className={`h-2 w-full shrink-0 ${isActive ? 'bg-[var(--color-gold-500)]' : 'bg-gray-300'}`} />
                <AdminCardContent className="p-6 flex flex-col h-full justify-between">
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
                          Valid til {new Date(voucher.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
