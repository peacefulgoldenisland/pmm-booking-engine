import React from 'react';
import ClientAuthGuard from '@/components/auth/ClientAuthGuard';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientAuthGuard>
      {children}
    </ClientAuthGuard>
  );
}
