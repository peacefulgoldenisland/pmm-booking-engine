import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, CheckCircle2, User, Phone } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface RegisterFormProps {
  onSwitchMode: (mode: 'login') => void;
}

export function RegisterForm({ onSwitchMode }: RegisterFormProps) {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setErrorMessage("Password must be at least 6 characters.");
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

      setSuccessMessage("Registration successful. Logging you in...");
      
      // Auto login setelah register (Guest Default)
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }

      setSuccessMessage("Registration successful! A verification link has been sent to your email. Redirecting...");
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: unknown) {
      const err = error as Error;
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Cek apakah user sudah ada di Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          fullName: user.displayName || 'Google User',
          phone: user.phoneNumber || '',
          pointsBalance: 0,
          isGuest: false,
          createdAt: new Date().toISOString()
        });
      }

      router.push('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to sign in with Google.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      key="register" 
      initial={{ opacity: 0, x: 10 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -10 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-10">
        <h1 className="text-4xl font-serif text-[var(--color-navy-900)] mb-3">Create Account</h1>
        <p className="text-sm font-light text-gray-500 leading-relaxed">Create your account to start booking your maritime journeys easily.</p>
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
          label="Full Name" 
          type="text" 
          required 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder="Enter your full name"
          icon={<User className="w-4 h-4" />} 
        />

        <Input 
          label="Phone Number" 
          type="tel" 
          required 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          placeholder="e.g. +62 812..."
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
          label="Password" 
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
          Register
        </Button>
      </form>

      <div className="relative mt-8 mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-gray-400 font-light tracking-widest">OR CONTINUE WITH</span>
        </div>
      </div>

      <Button 
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full !rounded-sm !py-4 flex items-center justify-center gap-3 border-gray-200 hover:bg-gray-50 text-gray-600"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="font-semibold tracking-wide text-xs">Google</span>
      </Button>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-xs text-gray-500 font-light">
          Already have an account? 
          <button onClick={() => onSwitchMode('login')} type="button" className="text-[var(--color-navy-900)] font-bold hover:text-[var(--color-gold-600)] transition-colors ml-2 uppercase tracking-widest text-[10px]">
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  );
}
