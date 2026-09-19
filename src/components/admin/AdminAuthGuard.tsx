"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in
        router.push('/admin/login');
        return;
      }

      try {
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.role === 'admin' || userData.role === 'superadmin') {
            setIsAuthorized(true);
          } else {
            // Logged in but not an admin
            console.error("Access Denied: User is not an admin.");
            router.push('/');
          }
        } else {
          // No user doc found
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-gold-500)] mb-4" />
        <p className="font-serif text-[var(--color-navy-900)] text-xl tracking-wide">
          Verifying Clearance...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
