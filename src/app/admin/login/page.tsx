"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Ship, ArrowLeft } from 'lucide-react';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[var(--color-navy-900)] transition-colors uppercase tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Homepage
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-multiply" />
        
        <div className="relative z-10 w-full max-w-md">
            <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2">
                    <Ship className="w-6 h-6 text-[var(--color-gold-500)]" />
                    <span className="text-xl tracking-widest text-[var(--color-navy-900)] uppercase flex items-center gap-2">
                    <span className="font-bold">PMM</span> 
                    <span className="font-serif italic text-[var(--color-gold-500)] lowercase text-2xl relative top-[1px]">Reserve</span>
                    </span>
                </div>
            </div>

            <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
