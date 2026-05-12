'use client';

import { useMemo } from 'react';

import { useTimerStore } from '@/store/timer.store';

type TimerApi = {
  isTimerRunning: boolean;
};

export function useTimer(): TimerApi {
  const activeTimer = useTimerStore((state) => state.activeTimer);

  return useMemo(
    () => ({
      isTimerRunning: activeTimer !== null,
    }),
    [activeTimer],
  );
}
