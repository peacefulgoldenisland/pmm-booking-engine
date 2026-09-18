import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/user';

interface LoginFormProps {
  onSwitchMode: (mode: 'register') => void;
}

export function LoginForm({ onSwitchMode }: LoginFormProps) {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    setErrorMessage(''); 

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      
      // Dynamic Role-based Routing (Admin vs Guest)
      if (userCredential.user) {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          if (userData.role === 'admin' || userData.role === 'superadmin') {
            router.push('/admin/dashboard');
            return;
          }
        }
      }
      
      // Default to Guest Dashboard
      router.push('/dashboard');

    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage('Invalid credentials. Please verify your email and secure passphrase.');
      } else {
        setErrorMessage('An unexpected encrypted error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
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
          <button onClick={() => onSwitchMode('register')} type="button" className="text-[var(--color-navy-900)] font-bold hover:text-[var(--color-gold-600)] transition-colors ml-2 uppercase tracking-widest text-[10px]">
            Request Access
          </button>
        </p>
      </div>
    </motion.div>
  );
}
