"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Search, Eye, ShieldAlert, Sparkles, User as UserIcon
} from 'lucide-react';

import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import type { User } from '@/types/user';

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // We order by createdAt descending. Ensure index exists or adjust query if needed.
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setGuests(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching guests:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredGuests = guests.filter(g => {
    const matchSearch = (g.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (g.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const tableHeaders = [
    "Guest Identity",
    "Contact Details",
    "Loyalty Balance",
    "Clearance Level",
    "Action"
  ];

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Guest Registry</h1>
          <p className="text-xs text-gray-500 mt-1">Directory of all registered members and VIPs.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-sm border border-gray-200/60 shadow-sm mb-6 flex items-center justify-end">
        {/* Search */}
        <div className="w-full md:w-96">
          <AdminInput
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            type="text" 
            placeholder="Search by Name or Email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Registry Table */}
      <AdminTable headers={tableHeaders} isLoading={isLoading}>
        {filteredGuests.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">
              No guests found matching your criteria.
            </td>
          </tr>
        ) : (
          filteredGuests.map((g) => (
            <tr key={g.id} className="hover:bg-[var(--color-surface-50)] transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] border border-gray-200 flex items-center justify-center text-[var(--color-navy-900)] shrink-0">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-navy-900)]">{g.fullName || 'Unnamed Guest'}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">ID: {g.id.substring(0, 8)}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xs font-medium text-[var(--color-navy-900)] truncate max-w-[200px]">{g.email}</div>
                <div className="text-[10px] text-gray-500 mt-1">{g.phone || '-'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-gold-500)]/10 text-[var(--color-gold-600)] rounded-sm border border-[var(--color-gold-500)]/20">
                  <Sparkles className="w-3 h-3" />
                  <span className="font-mono font-bold text-xs">{g.pointsBalance?.toLocaleString('id-ID') || 0}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                {g.role === 'admin' || g.role === 'superadmin' ? (
                  <AdminBadge variant="brand" className="gap-1">
                    <ShieldAlert className="w-3 h-3 text-[var(--color-gold-400)]" /> {g.role}
                  </AdminBadge>
                ) : (
                  <AdminBadge variant="default">
                    {g.role || 'user'}
                  </AdminBadge>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <Link 
                  href={`/admin/guests/${g.id}`}
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
