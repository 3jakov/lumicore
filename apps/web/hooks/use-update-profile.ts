'use client';

import { useEffect, useRef, useState } from 'react';

import type { CurrentUser, UpdateOwnProfileDto } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

type UpdateProfileState = {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'An error occurred. Please try again.';
}

/**
 * Mutation hook for PATCH /employees/me.
 *
 * On success:
 *  - Merges the updated Employee fields into currentUser in auth store
 *  - This keeps full_name, initials, language, time_format, and avatar_color
 *    consistent between the backend response and the session state
 *  - language change propagates immediately to useTranslation via the store
 *
 * isSuccess auto-resets after 3 seconds to allow re-save without stale feedback.
 */
export function useUpdateProfile() {
  const [state, setState] = useState<UpdateProfileState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  async function updateProfile(dto: UpdateOwnProfileDto): Promise<void> {
    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      const updated = await apiClient.patch<CurrentUser>('/employees/me', { body: dto });

      // Merge the backend response into the live session — single source of truth
      const { accessToken, currentUser } = useAuthStore.getState();
      if (accessToken && currentUser) {
        useAuthStore.getState().setSession({
          accessToken,
          currentUser: {
            ...currentUser,
            full_name: updated.full_name,
            initials: updated.initials,
            language: updated.language,
            time_format: updated.time_format,
            photo_url: updated.photo_url ?? currentUser.photo_url,
            avatar_color: updated.avatar_color,
          },
        });
      }

      setState({ isLoading: false, isSuccess: true, error: null });

      // Auto-clear success feedback after 3s
      successTimer.current = setTimeout(() => {
        setState((s) => ({ ...s, isSuccess: false }));
      }, 3000);
    } catch (err) {
      setState({ isLoading: false, isSuccess: false, error: getErrorMessage(err) });
    }
  }

  return { ...state, updateProfile };
}
