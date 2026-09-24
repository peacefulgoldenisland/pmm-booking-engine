"use client";

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, UserCircle, Users, Ticket, Settings, ShieldAlert, LogOut, ChevronDown } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { useAuthStore } from '@/store/useAuthStore';
import { logAuditTrail } from '@/lib/auditLogger';

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>('Admin');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { hasAccess, user: currentUser } = useAuthStore();
  
  // Format the pathname into a readable page title
  const getPageTitle = () => {
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length <= 1) return 'Dashboard';
    
    const lastPart = pathParts[1];
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().fullName) {
            setAdminName(userDoc.data().fullName);
          } else {
            setAdminName(user.email?.split('@')[0] || 'Admin');
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
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
      router.push('/admin/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const hasInternalAccess = hasAccess('staff') || hasAccess('agents');
  
  const isSubPage = pathname.includes('/new') || 
                    pathname.includes('/edit') || 
                    pathname.includes('/create') ||
                    (pathname.startsWith('/admin/bookings/') && pathname !== '/admin/bookings') ||
                    (pathname.startsWith('/admin/users/guests/') && pathname !== '/admin/users/guests');

  return (
    <header className={`bg-white h-16 md:h-20 border-b border-gray-200 shadow-sm items-center justify-between px-4 md:px-6 sticky top-0 z-40 flex ${isSubPage ? 'hidden md:flex' : 'flex'}`}>
      
      {/* Left side / Title */}
      <div className="flex-1 md:flex-none">
        <h2 className="text-lg md:text-xl font-serif text-[var(--color-navy-900)] truncate">{getPageTitle()}</h2>
        <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold hidden md:block">Admin Dashboard</p>
      </div>

      {/* Right side: Search, Notifications, Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* Search Bar (Hidden on Mobile) */}
        <div className="hidden md:block w-64">
          <AdminInput 
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            type="text" 
            placeholder="Search..." 
            className="rounded-full bg-[var(--color-surface-50)] shadow-inner border-transparent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-[var(--color-navy-900)] transition-colors hidden md:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 hidden md:block" />

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1 pr-2 md:p-2 rounded-full hover:bg-[var(--color-surface-50)] transition-colors focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-[var(--color-navy-900)]">{adminName}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Administrator</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--color-surface-50)] border border-gray-200 flex items-center justify-center text-[var(--color-navy-900)] shadow-sm">
              <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 md:hidden" />
          </button>

          {/* Dropdown Menu (Secondary Navigation for Mobile) */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              
              <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                <p className="text-sm font-bold text-[var(--color-navy-900)]">{adminName}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Administrator</p>
              </div>

              {/* Mobile Only Links */}
              <div className="md:hidden">
                {hasInternalAccess && (
                  <>
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Internal Team</div>
                    {hasAccess('staff') && (
                      <Link href="/admin/users/staff" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-gold-600)]">
                        <Users className="w-4 h-4 mr-3 text-gray-400" /> Staff
                      </Link>
                    )}
                    {hasAccess('agents') && (
                      <Link href="/admin/users/agents" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-gold-600)]">
                        <Users className="w-4 h-4 mr-3 text-gray-400" /> Agents
                      </Link>
                    )}
                  </>
                )}

                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">System</div>
                {hasAccess('system') && (
                  <Link href="/admin/system/dev-tools" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-gold-600)]">
                    <Settings className="w-4 h-4 mr-3 text-gray-400" /> Dev Tools
                  </Link>
                )}
                {hasAccess('audit') && (
                  <Link href="/admin/support/audit" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-gold-600)]">
                    <ShieldAlert className="w-4 h-4 mr-3 text-gray-400" /> Audit Log
                  </Link>
                )}
                <div className="border-t border-gray-100 my-2"></div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" /> Sign Out
              </button>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
}
