'use client';

import { PlayCircle } from 'lucide-react';

import { useTimerStore } from '@/store/timer.store';

export function TimerDock(): JSX.Element | null {
  const activeTimer = useTimerStore((state) => state.activeTimer);

  if (activeTimer) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3 shadow-shell">
        <p className="text-sm font-semibold">Timer placeholder</p>
        <p className="mt-1 text-xs text-text-secondary">
          Active timer UI will plug in here during M3.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden rounded-full border border-border-subtle bg-surface-2/90 px-4 py-3 text-sm text-text-secondary shadow-shell xl:flex xl:items-center xl:gap-2">
      <PlayCircle className="h-4 w-4 text-accent-600" />
      Timer dock ready
    </div>
  );
}
