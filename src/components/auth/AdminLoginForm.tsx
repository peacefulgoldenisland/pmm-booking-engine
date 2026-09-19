import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/user';

export function AdminLoginForm() {
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
      
      if (userCredential.user) {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          if (userData.role !== 'admin' && userData.role !== 'superadmin') {
            await auth.signOut();
            setErrorMessage('Unauthorized access. This portal is for administrators only.');
            setIsLoading(false);
            return;
          }
        } else {
            await auth.signOut();
            setErrorMessage('User record not found.');
            setIsLoading(false);
            return;
        }
      }
      
      router.push('/admin/dashboard');

    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage('Invalid credentials.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      key="admin-login" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white p-8 rounded-sm shadow-luxury border border-gray-200 w-full max-w-md mx-auto"
    >
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto bg-[var(--color-navy-900)] rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-[var(--color-gold-500)]" />
        </div>
        <h1 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2">Admin Portal</h1>
        <p className="text-xs font-light text-gray-500">Secure access for staff and administrators</p>
      </div>

      {errorMessage && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 text-red-600 text-[11px] font-medium bg-red-50 p-3 rounded-sm border border-red-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" /> {errorMessage}
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input 
          label="Admin Email" 
          type="email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="admin@peacefulgoldenisland.com"
          icon={<Mail className="w-4 h-4" />} 
        />
        
        <Input 
          label="Password" 
          type="password" 
          required 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter password"
          icon={<Lock className="w-4 h-4" />} 
        />

        <Button 
          type="submit" 
          isLoading={isLoading} 
          className="w-full mt-6 !rounded-sm !py-3 uppercase tracking-widest text-xs !bg-[var(--color-navy-900)] hover:!bg-[var(--color-navy-800)]"
        >
          Sign In
        </Button>
      </form>
    </motion.div>
  );
}
