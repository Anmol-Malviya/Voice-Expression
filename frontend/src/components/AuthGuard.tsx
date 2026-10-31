'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { LoadingState } from './LoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAppStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If not authenticated and not already on auth/landing pages
    if (!isAuthenticated && !user) {
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
        return;
      }
    }
    setIsChecking(false);
  }, [isAuthenticated, user, pathname, router]);

  if (isChecking && !isAuthenticated) {
    return <LoadingState message="Verifying session..." subMessage="Loading assistive workspace" />;
  }

  return <>{children}</>;
};

export default AuthGuard;

