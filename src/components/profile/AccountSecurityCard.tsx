import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, Lock, PlusCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { 
  linkWithPopup, 
  GoogleAuthProvider, 
  updatePassword
} from 'firebase/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AccountSecurityCard() {
  const [providers, setProviders] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const activeProviders = auth.currentUser.providerData.map(p => p.providerId);
      setProviders(activeProviders);
    }
  }, []);

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    setIsLinking(true);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      
      const activeProviders = auth.currentUser.providerData.map(p => p.providerId);
      setProviders(activeProviders);
      setMessage({ type: 'success', text: 'Google account successfully linked.' });
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        setMessage({ type: 'error', text: 'This Google account is already linked to another user.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to link Google account.' });
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsSettingPassword(true);
    setMessage(null);
    try {
      await updatePassword(auth.currentUser, newPassword);
      
      // Reload user to update providerData
      await auth.currentUser.reload();
      const activeProviders = auth.currentUser.providerData.map(p => p.providerId);
      setProviders(activeProviders);
      
      setMessage({ type: 'success', text: 'Password set successfully! You can now log in using your email.' });
      setNewPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'For security reasons, please log out and log back in with Google before setting a password.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to set password.' });
      }
    } finally {
      setIsSettingPassword(false);
    }
  };

  const hasGoogle = providers.includes('google.com');
  const hasPassword = providers.includes('password');

  return (
    <div className="bg-white rounded-xl shadow-luxury border border-gray-200/60 overflow-hidden mt-6 relative p-8 md:p-10">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--color-navy-700)] to-[var(--color-navy-900)]" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-[var(--color-navy-900)] mb-2 flex items-center gap-3">
          <Shield className="w-6 h-6 text-[var(--color-gold-500)]" />
          Account & Security
        </h2>
        <p className="text-gray-500 text-xs font-light max-w-2xl">
          Manage your connected accounts and security methods. Linking multiple providers allows you to sign in using different methods.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-sm border flex items-start gap-3 text-[11px] font-medium ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-600 border-red-100' 
            : 'bg-[var(--color-gold-50)] text-[var(--color-navy-900)] border-[var(--color-gold-300)]'
        }`}>
          {message.type === 'error' ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 text-[var(--color-gold-600)]" />}
          <p>{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Email/Password Provider */}
        <div className="p-5 border border-gray-100 rounded-lg flex flex-col justify-between relative overflow-hidden">
          {hasPassword && (
             <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full z-0" />
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-[var(--color-navy-900)] flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> Email & Password
              </h3>
              {hasPassword && (
                <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Active</span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-light mb-4">
              Sign in using your email address and a secure password.
            </p>
          </div>

          {!hasPassword && (
            <form onSubmit={handleSetPassword} className="space-y-3 mt-4 relative z-10">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
              <Button type="submit" isLoading={isSettingPassword} className="w-full !py-2.5 text-xs">
                Set Password
              </Button>
            </form>
          )}
        </div>

        {/* Google Provider */}
        <div className="p-5 border border-gray-100 rounded-lg flex flex-col justify-between relative overflow-hidden">
          {hasGoogle && (
             <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full z-0" />
          )}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-[var(--color-navy-900)] flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Account
              </h3>
              {hasGoogle && (
                <span className="bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">Linked</span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-light mb-4">
              Sign in quickly and securely with your Google account.
            </p>
          </div>

          {!hasGoogle && (
            <div className="mt-4 relative z-10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleLinkGoogle} 
                isLoading={isLinking}
                className="w-full !py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Connect Google
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
