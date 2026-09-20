"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types/user';

interface ClientAuthGuardProps {
  children: React.ReactNode;
}

export default function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setLoading } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in
        router.push('/login');
        return;
      }

      try {
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          
          if (userData.isSuspended) {
            console.error("Access Denied: Account is suspended.");
            auth.signOut();
            router.push('/login?error=suspended');
            return;
          }

          // Allow access for all valid users to the client portal
          setUser({ ...userData, id: user.uid } as User);
          setIsAuthorized(true);
        } else {
          // No user doc found
          router.push('/login');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push('/login');
      } finally {
        setIsLoadingState(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname, setUser, setLoading]);

  if (isLoadingState) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-gold-500)] mb-4" />
        <p className="font-serif text-[var(--color-navy-900)] text-xl tracking-wide">
          Loading...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
