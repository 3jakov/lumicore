import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { TimeEntryDetail } from '@lumicore/shared-types';
import { ElapsedClock } from './ElapsedClock';
import { usePauseTimer, useResumeTimer, useStopTimer } from '@/hooks/use-active-timer';

interface Props {
  entry: TimeEntryDetail;
}

export function ActiveTimerCard({ entry }: Props) {
  const pause = usePauseTimer();
  const resume = useResumeTimer();
  const stop = useStopTimer();

  const isLoading = pause.isPending || resume.isPending || stop.isPending;
  const error = pause.error ?? resume.error ?? stop.error;

  // Sum seconds from all *closed* pauses
  const closedPauseSec = entry.pauses.reduce((acc, p) => {
    if (p.pause_end == null) return acc;
    return (
      acc +
      Math.floor(
        (new Date(p.pause_end).getTime() - new Date(p.pause_start).getTime()) / 1000,
      )
    );
  }, 0);

  // When paused: also subtract the current open-pause duration so the frozen
  // clock shows "active seconds before pause started", not "active + pause time".
  const openPause = entry.pauses.find((p) => p.pause_end == null);
  const openPauseSec = openPause
    ? Math.floor((Date.now() - new Date(openPause.pause_start).getTime()) / 1000)
    : 0;

  // Total seconds to subtract from the wall-clock elapsed
  const totalPausedSec = closedPauseSec + (entry.is_paused ? openPauseSec : 0);

  return (
    <View className="mx-4 rounded-2xl bg-surface-1 p-5">
      {/* Project / task label */}
      <Text className="text-xs font-medium uppercase tracking-widest text-text-muted">
        {entry.project_id ? 'Проект' : 'Без проекта'}
      </Text>

      {/* We don't have project_name in TimeEntryDetail directly — show id fallback */}
      {entry.project_id && (
        <Text className="mt-0.5 text-base font-semibold text-text-primary" numberOfLines={1}>
          #{entry.project_id}
          {entry.task_id ? `  ·  задача #${entry.task_id}` : ''}
        </Text>
      )}
      {!entry.project_id && entry.no_project_reason && (
        <Text className="mt-0.5 text-sm text-text-muted" numberOfLines={2}>
          {entry.no_project_reason}
        </Text>
      )}

      {/* Elapsed clock */}
      <ElapsedClock
        startedAt={entry.started_at}
        pausedSeconds={totalPausedSec}
        frozen={entry.is_paused}
        className="mt-4 text-center text-5xl font-bold tabular-nums text-text-primary"
      />

      {/* Paused indicator */}
      {entry.is_paused && (
        <Text className="mt-1 text-center text-sm font-medium text-accent-500">
          ⏸ Пауза
        </Text>
      )}

      {/* API error */}
      {error && (
        <Text className="mt-2 text-center text-sm text-timer-stop">
          {error.message}
        </Text>
      )}

      {/* Action buttons */}
      <View className="mt-6 flex-row gap-3">
        {/* Pause / Resume */}
        {!entry.is_paused ? (
          <Pressable
            onPress={() => pause.mutate(entry.id)}
            disabled={isLoading}
            className="flex-1 items-center rounded-xl bg-surface-2 py-3.5"
          >
            {isLoading && pause.isPending ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Text className="font-semibold text-accent-500">⏸ Пауза</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => resume.mutate(entry.id)}
            disabled={isLoading}
            className="flex-1 items-center rounded-xl bg-surface-2 py-3.5"
          >
            {isLoading && resume.isPending ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Text className="font-semibold text-accent-500">▶ Продолжить</Text>
            )}
          </Pressable>
        )}

        {/* Stop */}
        <Pressable
          onPress={() => stop.mutate(entry.id)}
          disabled={isLoading}
          className="flex-1 items-center rounded-xl bg-timer-stop py-3.5"
        >
          {isLoading && stop.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-semibold text-white">⏹ Стоп</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
