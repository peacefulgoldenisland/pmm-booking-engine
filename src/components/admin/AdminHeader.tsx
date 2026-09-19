"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Search, UserCircle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AdminInput } from '@/components/admin/ui/AdminInput';

export default function AdminHeader() {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState<string>('Admin');
  
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

  return (
    <header className="bg-white h-20 border-b border-gray-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
      
      {/* Left side: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-gray-500 hover:text-[var(--color-navy-900)] transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-serif text-[var(--color-navy-900)]">{getPageTitle()}</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Admin Dashboard</p>
        </div>
      </div>

      {/* Right side: Search, Notifications, Profile */}
      <div className="flex items-center gap-4 md:gap-6">
        
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
        <button className="relative p-2 text-gray-400 hover:text-[var(--color-navy-900)] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 hidden md:block" />

        {/* Admin Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-[var(--color-navy-900)]">{adminName}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-50)] border border-gray-200 flex items-center justify-center text-[var(--color-navy-900)] shadow-sm">
            <UserCircle className="w-6 h-6" />
          </div>
        </div>
        
      </div>
    </header>
  );
}
