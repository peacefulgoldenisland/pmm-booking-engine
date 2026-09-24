"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Ship, ArrowLeft } from 'lucide-react';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-white md:bg-gray-50 flex flex-col font-sans">
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:gap-2 text-xs font-bold text-gray-500 hover:text-[var(--color-navy-900)] transition-colors uppercase tracking-widest group rounded-full md:rounded-none bg-gray-100 md:bg-transparent"
        >
          <ArrowLeft className="w-5 h-5 md:w-4 md:h-4 md:group-hover:-translate-x-1 transition-transform" /> 
          <span className="hidden md:inline">Return to Homepage</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-6 relative">
        {/* Background elements (Desktop only) */}
        <div className="hidden md:block absolute top-0 left-0 w-full h-1 bg-[var(--color-gold-500)]" />
        <div className="hidden md:block absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-multiply" />
        
        <div className="relative z-10 w-full max-w-md pt-8 md:pt-0">
            <div className="flex justify-center mb-10 md:mb-8">
                <div className="inline-flex items-center justify-center">
                    <Image 
                      src="/images/logo-dark.png" 
                      alt="PGI Reserve" 
                      width={200} 
                      height={80} 
                      className="h-16 md:h-14 w-auto object-contain"
                      priority
                    />
                </div>
            </div>

            <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
