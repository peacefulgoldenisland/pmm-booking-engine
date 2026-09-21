"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Ship, LogOut, User, LayoutDashboard, ChevronDown, Search, Crown } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { GuestProfile } from '@/types/user';

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [userProfile, setUserProfile] = useState<GuestProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Ambil Data Profil User
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile({ email: user.email, ...userDoc.data() } as GuestProfile);
          } else {
            setUserProfile({ email: user.email } as GuestProfile);
          }
        } catch (error) {
          console.error("Error fetching user data for header:", error);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Klik di Luar Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fitur Keyboard Shortcut ⌘K / Ctrl+K untuk Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Logika Scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
        setIsDropdownOpen(false); 
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Logic pencarian bisa diarahkan ke halaman hasil pencarian nanti
      console.log("Searching for:", searchQuery);
      alert(`Search feature triggered for: ${searchQuery}`);
      setSearchQuery("");
      searchInputRef.current?.blur();
    }
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled 
          ? 'bg-[var(--color-navy-900)]/95 backdrop-blur-md shadow-luxury border-b border-white/5 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4 lg:gap-8">
        
        {/* ======================================================== */}
        {/* LOGO & BRAND (Kiri)                                      */}
        {/* ======================================================== */}
        <div 
          onClick={() => router.push('/')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <Image 
             src={isScrolled ? "/images/logo-dark.png" : "/images/logo-light.png"} 
             alt="PGI Reserve" 
             width={220} 
             height={80} 
             className="h-12 w-auto object-contain hidden md:block"
             priority 
          />
          <Image 
             src={isScrolled ? "/images/logo-dark.png" : "/images/logo-light.png"} 
             alt="PGI Reserve" 
             width={180} 
             height={60} 
             className="h-9 w-auto object-contain block md:hidden"
             priority 
          />
        </div>

        {/* ======================================================== */}
        {/* GLOBAL SEARCH BAR (Tengah)                               */}
        {/* ======================================================== */}
        <div className="flex-1 max-w-xl hidden sm:block relative group">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`w-4 h-4 transition-colors ${
                isScrolled ? 'text-gray-400 group-focus-within:text-[var(--color-gold-500)]' : 'text-gray-500 group-focus-within:text-[var(--color-gold-600)]'
              }`} />
            </div>
            
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations, manifests, or services..." 
              className={`w-full h-11 pl-11 pr-16 text-xs font-medium tracking-wide rounded-full border transition-all duration-300 outline-none ${
                isScrolled 
                  ? 'bg-white/10 border-white/10 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-[var(--color-gold-500)] focus:ring-1 focus:ring-[var(--color-gold-500)]' 
                  : 'bg-black/5 backdrop-blur-md border-black/10 text-[var(--color-navy-900)] placeholder:text-gray-600 hover:bg-black/10 focus:bg-white focus:border-[var(--color-gold-400)] focus:ring-1 focus:ring-[var(--color-gold-400)] focus:shadow-sm'
              }`}
            />
            
            <div className={`absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none`}>
              <div className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest border transition-colors ${
                isScrolled ? 'bg-white/10 border-white/20 text-gray-400' : 'bg-white/50 border-gray-200 text-gray-500'
              }`}>
                ⌘K
              </div>
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* USER DROPDOWN (Kanan)                                    */}
        {/* ======================================================== */}
        <div className="flex items-center shrink-0" ref={dropdownRef}>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-3 pr-4 pl-2 py-2 rounded-full transition-all duration-300 group focus:outline-none ${
                isScrolled 
                  ? 'hover:bg-white/5 border border-transparent hover:border-white/10' 
                  : 'hover:bg-[var(--color-surface-50)] border border-transparent hover:border-gray-200'
              }`}
            >
              {/* Avatar Circle */}
              <div className="w-10 h-10 rounded-full bg-[var(--color-gold-500)] p-[1px] flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isScrolled ? 'bg-[var(--color-navy-800)]' : 'bg-white'}`}>
                  {userProfile?.photoUrl ? (
                    <Image 
                      src={userProfile.photoUrl as string} 
                      alt="Avatar" 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-cover"
                      unoptimized={true}
                    />
                  ) : (
                    <span className="text-base font-serif text-[var(--color-gold-600)]">
                      {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4 text-[var(--color-gold-600)]" />}
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Chevron */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium hidden lg:block max-w-[120px] truncate transition-colors ${
                  isScrolled ? 'text-white/90 group-hover:text-white' : 'text-[var(--color-navy-900)] group-hover:text-[var(--color-gold-600)]'
                }`}>
                  {userProfile?.fullName?.split(' ')[0] || 'Guest'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180' : ''} ${
                  isScrolled ? 'text-white/50 group-hover:text-white/80' : 'text-gray-400 group-hover:text-[var(--color-navy-900)]'
                }`} />
              </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="absolute right-0 mt-3 w-64 bg-white rounded-sm shadow-luxury border border-gray-200/50 overflow-hidden z-50 origin-top-right"
                >
                  <div className="px-6 py-5 border-b border-gray-100">
                    <p className="text-base font-serif text-[var(--color-navy-900)] truncate">
                      {userProfile?.fullName || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500 font-light truncate mt-1">
                      {userProfile?.email}
                    </p>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/dashboard');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold rounded-sm transition-all duration-200 ${pathname === '/dashboard' ? 'bg-[var(--color-surface-50)] text-[var(--color-gold-600)]' : 'text-gray-500 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-navy-900)]'}`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      My Bookings
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/dashboard/profile');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold rounded-sm transition-all duration-200 ${pathname.includes('/profile') ? 'bg-[var(--color-surface-50)] text-[var(--color-gold-600)]' : 'text-gray-500 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-navy-900)]'}`}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </button>

                    {/* TOMBOL REWARDS (NEW) */}
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/rewards');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold rounded-sm transition-all duration-200 ${pathname.includes('/rewards') ? 'bg-[var(--color-surface-50)] text-[var(--color-gold-600)]' : 'text-gray-500 hover:bg-[var(--color-surface-50)] hover:text-[var(--color-navy-900)]'}`}
                    >
                      <Crown className="w-4 h-4" />
                      Rewards
                    </button>
                  </div>

                  <div className="p-2 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </nav>
  );
}