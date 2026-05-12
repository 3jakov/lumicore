'use client';

import { create } from 'zustand';

type ActiveTimer = {
  timeEntryId: number;
  startedAt: string;
  label: string;
} | null;

type TimerState = {
  activeTimer: ActiveTimer;
  setActiveTimer: (timer: ActiveTimer) => void;
};

export const useTimerStore = create<TimerState>((set) => ({
  activeTimer: null,
  setActiveTimer: (activeTimer) => set(() => ({ activeTimer })),
}));
