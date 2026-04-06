'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuthStore } from '@/store/auth.store';

type RequireAuthProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Client-side route guard for (app) routes.
 *
 * By the time this renders, AuthBootstrap has already resolved — isReady is
 * true and useAuthStore reflects the real session state. No polling or
 * additional /auth/me calls are needed here.
 *
 * Behaviour:
 *  - authenticated  → renders children immediately, no flicker
 *  - unauthenticated → returns null (blank) and navigates to /login
 */
export function RequireAuth({ children }: RequireAuthProps): JSX.Element | null {
  const currentUser = useAuthStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  // Return null while navigation is pending to prevent a flash of protected UI.
  if (!currentUser) return null;

  return <>{children}</>;
}
