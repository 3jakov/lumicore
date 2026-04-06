'use client';

import { create } from 'zustand';

import type { SupportedLanguage } from '@/lib/i18n';

type SessionUser = {
  id: number;
  fullName: string;
  language: SupportedLanguage;
};

type AuthState = {
  accessToken: string | null;
  currentUser: SessionUser | null;
  language: SupportedLanguage;
  setSession: (payload: { accessToken: string | null; currentUser: SessionUser | null }) => void;
  setLanguage: (language: SupportedLanguage) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  currentUser: null,
  language: 'et',
  setSession: ({ accessToken, currentUser }) =>
    set(() => ({
      accessToken,
      currentUser,
      language: currentUser?.language ?? 'et',
    })),
  setLanguage: (language) =>
    set((state) => ({
      language,
      currentUser: state.currentUser ? { ...state.currentUser, language } : null,
    })),
  clearSession: () =>
    set(() => ({
      accessToken: null,
      currentUser: null,
      language: 'et',
    })),
}));
