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
      
      // Filter out internal users so this page only displays real guests
      const guestUsers = data.filter(u => u.role !== 'admin' && u.role !== 'superadmin' && u.role !== 'staff' && u.role !== 'agent');
      
      setGuests(guestUsers);
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
    "Role",
    "Action"
  ];

  return (
    <div className="pb-20">
      {/* Mobile Page Header */}
      <div className="md:hidden mb-4 mt-2">
        <h1 className="text-3xl font-serif text-[var(--color-navy-900)] mb-1">Guests</h1>
        <p className="text-xs text-gray-500">
          Showing {filteredGuests.length} {filteredGuests.length === 1 ? 'member' : 'members'}.
        </p>
      </div>

      {/* Desktop Page Header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-navy-900)]">Guests Directory</h1>
          <p className="text-xs text-gray-500 mt-1">Directory of all registered members.</p>
        </div>
      </div>

      {/* Control Panel (Search on Mobile) */}
      <div className="md:static md:bg-white md:p-4 md:rounded-sm md:border md:border-gray-200/60 md:shadow-sm py-3 md:py-0 mb-6 flex items-center justify-end -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200/80 md:border-none rounded-sm pl-11 pr-4 py-3 md:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-400)] shadow-sm font-medium text-[var(--color-navy-900)] placeholder:text-gray-400 transition-shadow"
          />
        </div>
      </div>

      {/* Registry Table (Desktop) */}
      <div className="hidden md:block">
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
                  href={`/admin/users/guests/${g.id}`}
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

      {/* Mobile Cards View (Floating Style) */}
      <div className="md:hidden flex flex-col gap-3 min-h-[50vh]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-100 p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : filteredGuests.length === 0 ? (
          <div className="bg-white rounded-sm border border-gray-100 p-8 text-center text-gray-500 text-sm shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-gray-300" />
            </div>
            <p className="font-medium text-gray-600">No guests found</p>
            <p className="text-xs text-gray-400 mt-1">Try another search term.</p>
          </div>
        ) : (
          filteredGuests.map((g) => (
            <Link key={g.id} href={`/admin/users/guests/${g.id}`} className="block">
              <div className="bg-white rounded-sm border border-gray-200 shadow-sm active:bg-blue-50 transition-colors relative overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200/60 flex items-center justify-center text-[var(--color-navy-900)] shrink-0 shadow-inner">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-navy-900)] leading-tight">{g.fullName || 'Unnamed Guest'}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {g.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 scale-90 origin-top-right">
                      {g.role === 'admin' || g.role === 'superadmin' ? (
                        <AdminBadge variant="brand" className="gap-1">
                          <ShieldAlert className="w-3 h-3 text-[var(--color-gold-400)]" /> {g.role}
                        </AdminBadge>
                      ) : (
                        <AdminBadge variant="default">
                          {g.role || 'user'}
                        </AdminBadge>
                      )}
                    </div>
                  </div>
                  
                  <div className="pl-[56px] mb-4">
                    <div className="text-xs font-bold text-gray-700 truncate mb-1">{g.email}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{g.phone || 'No phone number'}</div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center pl-[56px]">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Loyalty Balance</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-gold-500)]/10 text-[var(--color-gold-600)] rounded-md border border-[var(--color-gold-500)]/20 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-mono font-bold text-xs">{g.pointsBalance?.toLocaleString('id-ID') || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
