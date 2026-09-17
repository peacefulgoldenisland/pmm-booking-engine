"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Ship, ArrowLeft, Quote } from 'lucide-react';

import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen h-screen flex overflow-hidden bg-[var(--color-surface-50)] font-sans">
      
      {/* ======================================================== */}
      {/* LEFT COLUMN: EDITORIAL VISUAL COVER (5/12 Width)         */}
      {/* ======================================================== */}
      <div className="hidden lg:flex w-5/12 relative flex-col justify-between overflow-hidden">
        {/* Deep Ocean Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=2000&auto=format&fit=crop")' }} 
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy-900)]/80 via-[var(--color-navy-900)]/40 to-[var(--color-navy-900)]/95" />
        
        {/* Top Branding */}
        <div className="relative z-10 p-12">
          <div onClick={() => router.push('/')} className="inline-flex items-center gap-3 cursor-pointer group">
            <Ship className="w-8 h-8 text-[var(--color-gold-500)] group-hover:scale-105 transition-transform duration-300" />
            <span className="text-2xl tracking-widest text-white uppercase flex items-center gap-2">
              <span className="font-bold">PMM</span> 
              <span className="font-serif italic text-[var(--color-gold-500)] lowercase text-3xl relative top-[2px]">Reserve</span>
            </span>
          </div>
        </div>

        {/* Bottom Social Proof / Quote */}
        <div className="relative z-10 p-12 mt-auto">
          <Quote className="w-8 h-8 text-[var(--color-gold-500)] opacity-50 mb-4" />
          <h2 className="text-2xl font-serif text-white leading-relaxed mb-6">
            "The pinnacle of maritime luxury. Managing my expeditions and securing priority clearance has never been more effortless."
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold-500)] flex items-center justify-center text-[var(--color-navy-900)] font-serif font-bold text-lg">
              A
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">Alexander Wright</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-gold-400)]">VVIP Guild Member</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: FOCUSED FORM AREA (7/12 Width)             */}
      {/* ======================================================== */}
      <div className="w-full lg:w-7/12 flex flex-col relative bg-[var(--color-surface-50)] h-full overflow-y-auto">
        
        {/* Mobile Navbar / Back Button */}
        <div className="p-6 md:p-10 flex items-center justify-between shrink-0">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-[var(--color-navy-900)] transition-colors uppercase tracking-widest group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Homepage
          </button>
          
          {/* Mobile Branding (Visible only on small screens) */}
          <div className="flex lg:hidden items-center gap-2">
            <Ship className="w-5 h-5 text-[var(--color-gold-500)]" />
            <span className="text-sm tracking-widest text-[var(--color-navy-900)] uppercase font-bold">
              PMM <span className="font-serif italic text-[var(--color-gold-600)] lowercase">Reserve</span>
            </span>
          </div>
        </div>

        {/* Center Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 pb-12">
          <div className="w-full max-w-[400px]">
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <LoginForm onSwitchMode={setMode} />
              ) : (
                <RegisterForm onSwitchMode={setMode} />
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}