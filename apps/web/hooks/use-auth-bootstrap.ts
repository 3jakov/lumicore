'use client';

import { useEffect, useState } from 'react';

import type { CurrentUser } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type AuthBootstrapResult = {
  isReady: boolean;
};

/**
 * Initialises the auth session on app mount.
 *
 * Flow:
 *  1. GET /auth/me with the current in-memory access token (null on page reload).
 *  2. If 401, apiClient automatically attempts a cookie-based refresh and retries.
 *     - Refresh success → setSession() is called by apiClient; retry resolves with CurrentUser.
 *     - Refresh failure → apiClient calls clearSession(); catch leaves store clean.
 *  3. On success, setSession() ensures store reflects the latest user data.
 *  4. isReady flips to true regardless of outcome so the app can proceed to route protection.
 */
export function useAuthBootstrap(): AuthBootstrapResult {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<CurrentUser>('/auth/me')
      .then((user) => {
        if (cancelled) return;
        // accessToken was set in the store either before this call (if already hydrated)
        // or during the refresh cycle triggered by apiClient on 401.
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          useAuthStore.getState().setSession({ accessToken, currentUser: user });
        }
      })
      .catch(() => {
        // Leave clean unauthenticated state.
        // apiClient.refreshAccessToken() already called clearSession() if refresh failed.
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []); // intentionally empty — runs once on mount

  return { isReady };
}
