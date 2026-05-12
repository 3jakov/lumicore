'use client';

import type { ReactNode } from 'react';

import { useAuthBootstrap } from '@/hooks/use-auth-bootstrap';

type AuthBootstrapProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Blocks rendering until the auth session bootstrap attempt is complete.
 * Renders nothing while the /auth/me call is in flight — avoids a flash of
 * unauthenticated UI before the session is known.
 *
 * Route protection (step 4) reads from useAuthStore after isReady is true.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps): JSX.Element | null {
  const { isReady } = useAuthBootstrap();

  if (!isReady) return null;

  return <>{children}</>;
}
