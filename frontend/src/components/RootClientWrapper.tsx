'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { AuthProvider } from "@/contexts/auth-context";

export function RootClientWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = getCookie('token');

  // Add any token-based routing logic here if needed
  
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
