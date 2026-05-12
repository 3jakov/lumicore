import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

interface Props {
  /** UTC ISO string — when the timer was started */
  startedAt: string;
  /** Total seconds already consumed by closed pauses */
  pausedSeconds: number;
  /** If true the clock freezes (currently paused) */
  frozen: boolean;
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function calcElapsed(startedAt: string, pausedSeconds: number): number {
  const total = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, total - pausedSeconds);
}

export function ElapsedClock({ startedAt, pausedSeconds, frozen, className }: Props) {
  const [elapsed, setElapsed] = useState(() =>
    calcElapsed(startedAt, pausedSeconds),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (frozen) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    // Tick immediately then every second
    setElapsed(calcElapsed(startedAt, pausedSeconds));
    intervalRef.current = setInterval(() => {
      setElapsed(calcElapsed(startedAt, pausedSeconds));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startedAt, pausedSeconds, frozen]);

  return (
    <Text className={className}>
      {formatElapsed(elapsed)}
    </Text>
  );
}
