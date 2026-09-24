"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpenCheck, Anchor, Users, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { hasAccess } = useAuthStore();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      id: 'dashboard',
      isActive: pathname === '/admin/dashboard'
    },
    {
      name: 'Bookings',
      href: '/admin/bookings',
      icon: BookOpenCheck,
      id: 'bookings',
      isActive: pathname.startsWith('/admin/bookings')
    },
    {
      name: 'Trips',
      href: '/admin/voyages',
      icon: Anchor,
      id: 'voyages',
      isActive: pathname.startsWith('/admin/voyages')
    },
    {
      name: 'Users',
      href: '/admin/users/guests',
      icon: Users,
      id: 'guests',
      isActive: pathname.startsWith('/admin/users')
    },
    {
      name: 'Vouchers',
      href: '/admin/vouchers',
      icon: Ticket,
      id: 'vouchers',
      isActive: pathname.startsWith('/admin/vouchers')
    }
  ];

  const isSubPage = pathname.includes('/new') || 
                    pathname.includes('/edit') || 
                    pathname.includes('/create') ||
                    (pathname.startsWith('/admin/bookings/') && pathname !== '/admin/bookings') ||
                    (pathname.startsWith('/admin/users/guests/') && pathname !== '/admin/users/guests');

  if (isSubPage) {
    return null; // Do not render on subpages in mobile (handled by layout hidden classes)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          if (!hasAccess(item.id)) return null;
          
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${item.isActive ? 'text-[var(--color-navy-900)]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${item.isActive ? 'bg-[var(--color-gold-50)] text-[var(--color-gold-600)]' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${item.isActive ? 'text-[var(--color-gold-600)]' : ''}`} />
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${item.isActive ? 'text-[var(--color-navy-900)]' : 'font-medium'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
