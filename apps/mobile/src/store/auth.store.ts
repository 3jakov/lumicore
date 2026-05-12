import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { AuthResponse, CurrentUser } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { PUSH_TOKEN_KEY } from '@/hooks/use-push-notifications';

const KEYS = {
  accessToken: 'lumicore_access_token',
  refreshToken: 'lumicore_refresh_token',
} as const;

interface AuthState {
  accessToken: string | null;
  currentUser: CurrentUser | null;
  isLoading: boolean;

  /** Call on app startup to rehydrate tokens from SecureStore. */
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Wire token provider into apiClient once store is created
  apiClient.setTokenProvider(() => get().accessToken);

  return {
    accessToken: null,
    currentUser: null,
    isLoading: true,

    async hydrate() {
      try {
        const token = await SecureStore.getItemAsync(KEYS.accessToken);
        if (!token) { set({ isLoading: false }); return; }

        // Validate token and fetch current user profile
        apiClient.setTokenProvider(() => token);
        const user = await apiClient.get<CurrentUser>('/auth/me');
        set({ accessToken: token, currentUser: user, isLoading: false });
      } catch {
        await SecureStore.deleteItemAsync(KEYS.accessToken);
        await SecureStore.deleteItemAsync(KEYS.refreshToken);
        set({ accessToken: null, currentUser: null, isLoading: false });
      }
    },

    async login(email, password) {
      const data = await apiClient.post<AuthResponse>('/auth/login', {
        body: { email, password },
      });
      await SecureStore.setItemAsync(KEYS.accessToken, data.access_token);
      await SecureStore.setItemAsync(KEYS.refreshToken, data.refresh_token);
      // AuthResponse.user is CurrentUser — same type as stored in the store
      set({ accessToken: data.access_token, currentUser: data.user });
    },

    async logout() {
      // Unregister push token before clearing auth — while we still have a
      // valid access token to authenticate the DELETE request.
      try {
        const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
        if (pushToken) {
          await apiClient.delete('/notifications/device-token', { body: { token: pushToken } });
          await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
        }
      } catch { /* best effort — stale token on the server is acceptable */ }

      try {
        await apiClient.post('/auth/logout');
      } catch { /* best effort */ }

      await SecureStore.deleteItemAsync(KEYS.accessToken);
      await SecureStore.deleteItemAsync(KEYS.refreshToken);
      set({ accessToken: null, currentUser: null });
    },
  };
});
