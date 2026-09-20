"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpenCheck, 
  UsersRound, 
  TicketPercent, 
  LogOut,
  Anchor,
  ShieldCheck,
  ChevronDown,
  Wrench
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { logAuditTrail } from '@/lib/auditLogger';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { hasAccess, user: currentUser } = useAuthStore();
  
  // State for Dropdown
  const [isUsersOpen, setIsUsersOpen] = useState(pathname.startsWith('/admin/users'));

  useEffect(() => {
    if (pathname.startsWith('/admin/users')) {
      setIsUsersOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await logAuditTrail({
          action: 'LOGOUT',
          module: 'Auth',
          targetId: currentUser.id,
          details: 'Admin signed out of the system',
          actor: currentUser
        });
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const NavItem = ({ href, icon: Icon, name, id, isActive }: any) => {
    if (!hasAccess(id)) return null;
    return (
      <Link 
        href={href}
        className={`flex items-center gap-4 px-3 py-3.5 rounded-sm transition-all duration-300 group relative overflow-hidden ${
          isActive 
            ? 'bg-[var(--color-gold-500)] text-[var(--color-navy-900)] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[var(--color-navy-900)]' : 'text-gray-400 group-hover:text-[var(--color-gold-400)]'}`} />
        <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 ${isActive ? 'text-[var(--color-navy-900)]' : 'text-gray-300 group-hover:text-white'}`}>
          {name}
        </span>
        {isActive && (
          <div className="absolute left-0 top-0 w-1 h-full bg-[var(--color-navy-900)] opacity-20" />
        )}
      </Link>
    );
  };

  const hasUsersAccess = hasAccess('guests') || hasAccess('staff');

  return (
    <aside className="w-20 hover:w-64 bg-[var(--color-navy-900)] text-white flex flex-col h-screen sticky top-0 border-r border-white/10 shadow-luxury hidden md:flex shrink-0 z-50 transition-all duration-300 ease-in-out group/sidebar overflow-y-auto admin-scrollbar">
      
      {/* Brand Logo */}
      <div className="h-20 flex items-center border-b border-white/10 px-5 pt-4 shrink-0">
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
        <NavItem href="/admin/dashboard" icon={LayoutDashboard} name="Dashboard" id="dashboard" isActive={pathname === '/admin/dashboard'} />
        <NavItem href="/admin/bookings" icon={BookOpenCheck} name="Bookings" id="bookings" isActive={pathname.startsWith('/admin/bookings')} />
        <NavItem href="/admin/voyages" icon={Anchor} name="Trips" id="voyages" isActive={pathname.startsWith('/admin/voyages')} />
        
        {/* Users Dropdown */}
        {hasUsersAccess && (
          <div className="flex flex-col">
            <button 
              onClick={() => setIsUsersOpen(!isUsersOpen)}
              className={`flex items-center gap-4 px-3 py-3.5 rounded-sm transition-all duration-300 group relative overflow-hidden text-gray-400 hover:text-white hover:bg-white/5 outline-none`}
            >
              <UsersRound className={`w-5 h-5 shrink-0 transition-colors text-gray-400 group-hover:text-[var(--color-gold-400)]`} />
              <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 text-gray-300 group-hover:text-white flex-1 text-left`}>
                Users Directory
              </span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 opacity-0 group-hover/sidebar:opacity-100 ${isUsersOpen ? "rotate-180" : ""}`} />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 flex flex-col gap-1 opacity-0 group-hover/sidebar:opacity-100 ${isUsersOpen ? "max-h-[200px] mt-1" : "max-h-0"}`}>
              
              {hasAccess('guests') && (
                <Link 
                  href="/admin/users/guests" 
                  className={`flex items-center gap-3 py-2 px-3 ml-[21px] rounded-sm text-xs font-semibold transition-all relative ${
                    pathname.startsWith('/admin/users/guests')
                      ? "text-[var(--color-gold-500)] bg-white/5" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className={`absolute -left-[14px] w-[12px] h-[1px] bg-white/10 ${pathname.startsWith('/admin/users/guests') && "bg-[var(--color-gold-500)]"}`} />
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${pathname.startsWith('/admin/users/guests') ? "bg-[var(--color-gold-500)] shadow-[0_0_8px_var(--color-gold-500)]" : "bg-gray-600"}`} />
                  <span className="whitespace-nowrap">Guests / Customers</span>
                </Link>
              )}

              {hasAccess('staff') && (
                <Link 
                  href="/admin/users/staff" 
                  className={`flex items-center gap-3 py-2 px-3 ml-[21px] rounded-sm text-xs font-semibold transition-all relative ${
                    pathname.startsWith('/admin/users/staff')
                      ? "text-[var(--color-gold-500)] bg-white/5" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className={`absolute -left-[14px] w-[12px] h-[1px] bg-white/10 ${pathname.startsWith('/admin/users/staff') && "bg-[var(--color-gold-500)]"}`} />
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${pathname.startsWith('/admin/users/staff') ? "bg-[var(--color-gold-500)] shadow-[0_0_8px_var(--color-gold-500)]" : "bg-gray-600"}`} />
                  <span className="whitespace-nowrap">Internal Staff</span>
                </Link>
              )}

            </div>
          </div>
        )}

        <NavItem href="/admin/vouchers" icon={TicketPercent} name="Vouchers" id="vouchers" isActive={pathname.startsWith('/admin/vouchers')} />
        <NavItem href="/admin/support/audit" icon={ShieldCheck} name="Audit Trail" id="audit" isActive={pathname.startsWith('/admin/support/audit')} />
        <NavItem href="/admin/system/dev-tools" icon={Wrench} name="System Tools" id="system" isActive={pathname.startsWith('/admin/system')} />
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 shrink-0">
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
