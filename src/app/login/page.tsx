"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ship, Mail, Lock, User, Phone, ShieldCheck, 
  ArrowLeft, CheckCircle2, Quote
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
  };

  // --- HANDLER 1: NORMAL LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    setErrorMessage(''); 
    setSuccessMessage('');

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMessage('Invalid credentials. Please verify your email and secure passphrase.');
      } else {
        setErrorMessage('An unexpected encrypted error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // --- HANDLER 2: REGISTER VIA BACKEND API ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setErrorMessage("Security protocol requires at least 6 characters.");
    setIsLoading(true); 
    setErrorMessage(''); 
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, fullName, phone })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSuccessMessage("Privilege granted. Establishing your secure session...");
      
      // Auto login setelah register
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to establish vault credentials.');
      setIsLoading(false);
    }
  };

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
              
              {/* ===================== MODE LOGIN ===================== */}
              {mode === 'login' && (
                <motion.div 
                  key="login" 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }} 
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="mb-10">
                    <h1 className="text-4xl font-serif text-[var(--color-navy-900)] mb-3">Access Vault</h1>
                    <p className="text-sm font-light text-gray-500 leading-relaxed">Sign in to orchestrate your next grand expedition and access your priority boarding passes.</p>
                  </div>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 text-red-600 text-[11px] font-medium bg-red-50 p-4 rounded-sm border border-red-100 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> {errorMessage}
                    </motion.div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-5">
                    <Input 
                      label="Registered Email" 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="e.g. james@bond.com"
                      icon={<Mail className="w-4 h-4" />} 
                    />
                    
                    <Input 
                      label="Secure Passphrase" 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter your encryption key"
                      icon={<Lock className="w-4 h-4" />} 
                    />

                    <Button 
                      type="submit" 
                      isLoading={isLoading} 
                      className="w-full mt-8 !rounded-sm !py-4 uppercase tracking-widest text-xs shadow-luxury"
                    >
                      Authenticate Session
                    </Button>
                  </form>

                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-light">
                      Do not have a registry entry? 
                      <button onClick={() => switchMode('register')} className="text-[var(--color-navy-900)] font-bold hover:text-[var(--color-gold-600)] transition-colors ml-2 uppercase tracking-widest text-[10px]">
                        Request Access
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ===================== MODE REGISTER ===================== */}
              {mode === 'register' && (
                <motion.div 
                  key="register" 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }} 
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="mb-10">
                    <h1 className="text-4xl font-serif text-[var(--color-navy-900)] mb-3">Join the Registry</h1>
                    <p className="text-sm font-light text-gray-500 leading-relaxed">Establish your VVIP profile to access exclusive charter benefits and seamless harbor clearance.</p>
                  </div>

                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 text-red-600 text-[11px] font-medium bg-red-50 p-4 rounded-sm border border-red-100 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> {errorMessage}
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 text-[var(--color-navy-900)] text-[11px] font-medium bg-[var(--color-gold-50)] p-4 rounded-sm border border-[var(--color-gold-300)] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--color-gold-600)] mt-0.5" /> {successMessage}
                    </motion.div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input 
                      label="Principal Guest Name" 
                      type="text" 
                      required 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="As shown on passport"
                      icon={<User className="w-4 h-4" />} 
                    />

                    <Input 
                      label="Priority Contact Number" 
                      type="tel" 
                      required 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+62 812..."
                      icon={<Phone className="w-4 h-4" />} 
                    />

                    <Input 
                      label="Email Address" 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="For e-tickets & manifests"
                      icon={<Mail className="w-4 h-4" />} 
                    />
                    
                    <Input 
                      label="Set Passphrase" 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Min. 6 characters"
                      icon={<Lock className="w-4 h-4" />} 
                    />

                    <Button 
                      type="submit" 
                      isLoading={isLoading} 
                      className="w-full mt-8 !rounded-sm !py-4 uppercase tracking-widest text-xs shadow-luxury"
                    >
                      Initialize Profile
                    </Button>
                  </form>

                  <div className="mt-10 pt-8 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-light">
                      Already an esteemed member? 
                      <button onClick={() => switchMode('login')} className="text-[var(--color-navy-900)] font-bold hover:text-[var(--color-gold-600)] transition-colors ml-2 uppercase tracking-widest text-[10px]">
                        Authenticate
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}