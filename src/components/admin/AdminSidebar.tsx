"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpenCheck, 
  ClipboardEdit,
  UsersRound, 
  TicketPercent, 
  LogOut,
  Anchor
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: BookOpenCheck },
  { name: 'Trips', href: '/admin/voyages', icon: Anchor },
  { name: 'Guests', href: '/admin/guests', icon: UsersRound },
  { name: 'Vouchers', href: '/admin/vouchers', icon: TicketPercent },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside className="w-20 hover:w-64 bg-[var(--color-navy-900)] text-white flex flex-col h-screen sticky top-0 border-r border-white/10 shadow-luxury hidden md:flex shrink-0 z-50 transition-all duration-300 ease-in-out group/sidebar overflow-hidden">
      
      {/* Brand Logo */}
      <div className="h-20 flex items-center border-b border-white/10 px-5 pt-4">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-sm bg-white/5 border border-[var(--color-gold-500)]/30 flex items-center justify-center group-hover:border-[var(--color-gold-500)] transition-colors shrink-0">
            <Anchor className="w-5 h-5 text-[var(--color-gold-400)]" />
          </div>
          <div className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            <h1 className="font-serif text-lg tracking-widest text-white leading-tight">PMM</h1>
            <p className="text-[9px] uppercase tracking-widest text-[var(--color-gold-400)] font-bold">Admin Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-4 px-3 py-3.5 rounded-sm transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-[var(--color-gold-500)] text-[var(--color-navy-900)] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[var(--color-navy-900)]' : 'text-gray-400 group-hover:text-[var(--color-gold-400)]'}`} />
              <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 ${isActive ? 'text-[var(--color-navy-900)]' : 'text-gray-300 group-hover:text-white'}`}>
                {item.name}
              </span>
              
              {isActive && (
                <div className="absolute left-0 top-0 w-1 h-full bg-[var(--color-navy-900)] opacity-20" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-3 py-3.5 rounded-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
