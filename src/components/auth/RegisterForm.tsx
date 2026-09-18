import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, CheckCircle2, User, Phone } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
      
      // Auto login setelah register (Guest Default)
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as Error;
      setErrorMessage(err.message || 'Failed to establish vault credentials.');
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
          <button onClick={() => onSwitchMode('login')} type="button" className="text-[var(--color-navy-900)] font-bold hover:text-[var(--color-gold-600)] transition-colors ml-2 uppercase tracking-widest text-[10px]">
            Authenticate
          </button>
        </p>
      </div>
    </motion.div>
  );
}
