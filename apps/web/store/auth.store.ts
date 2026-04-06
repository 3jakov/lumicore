'use client';

import { create } from 'zustand';

import type { CurrentUser } from '@lumicore/shared-types';
import { Language } from '@lumicore/shared-types';

type AuthState = {
  accessToken: string | null;
  currentUser: CurrentUser | null;
  language: Language;
  setSession: (payload: { accessToken: string; currentUser: CurrentUser }) => void;
  setLanguage: (language: Language) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  currentUser: null,
  language: Language.ET,
  setSession: ({ accessToken, currentUser }) =>
    set(() => ({
      accessToken,
      currentUser,
      language: currentUser.language,
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
      language: Language.ET,
    })),
}));
