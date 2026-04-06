'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuthStore } from '@/store/auth.store';

type RedirectIfAuthenticatedProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Auth-route guard. Mirrors RequireAuth but inverted:
 * authenticated users are bounced to /dashboard,
 * unauthenticated users see the children (login page).
 *
 * Relies on AuthBootstrap having resolved before this renders —
 * currentUser is the authoritative final state, no race conditions.
 */
export function RedirectIfAuthenticated({
  children,
}: RedirectIfAuthenticatedProps): JSX.Element | null {
  const currentUser = useAuthStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  if (currentUser) return null;

  return <>{children}</>;
}
