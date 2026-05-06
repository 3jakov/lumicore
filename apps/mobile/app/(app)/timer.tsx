import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useActiveTimer } from '@/hooks/use-active-timer';
import { ActiveTimerCard } from '@/components/timer/ActiveTimerCard';
import { StartTimerSheet } from '@/components/timer/StartTimerSheet';

export default function TimerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: activeEntry, isLoading, isError, refetch } = useActiveTimer();
  const [showStart, setShowStart] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface-0"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface-0 px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-text-muted">Не удалось загрузить таймер</Text>
        <Pressable onPress={() => refetch()} className="mt-4">
          <Text className="text-accent-500">Повторить</Text>
        </Pressable>
      </View>
    );
  }

  // ── Start form ────────────────────────────────────────────────────────────
  if (showStart) {
    return (
      <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 pb-3">
          <Pressable onPress={() => setShowStart(false)}>
            <Text className="text-accent-500">✕ Закрыть</Text>
          </Pressable>
        </View>
        <StartTimerSheet onStarted={() => setShowStart(false)} />
      </View>
    );
  }

  // ── Active timer ──────────────────────────────────────────────────────────
  if (activeEntry) {
    return (
      <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 pb-4 pt-2">
          <Pressable onPress={() => router.back()}>
            <Text className="text-accent-500">← Назад</Text>
          </Pressable>
          <Text className="text-base font-semibold text-text-primary">Таймер</Text>
          <View className="w-16" />
        </View>
        <ActiveTimerCard entry={activeEntry} />
      </View>
    );
  }

  // ── Idle — no active timer ────────────────────────────────────────────────
  return (
    <View
      className="flex-1 bg-surface-0 px-6"
      style={{ paddingTop: insets.top }}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} className="pt-2">
        <Text className="text-accent-500">← Назад</Text>
      </Pressable>

      {/* Centered idle state */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-5xl">⏱</Text>
        <Text className="mt-4 text-xl font-bold text-text-primary">
          Таймер не запущен
        </Text>
        <Text className="mt-2 text-center text-sm text-text-muted">
          Нажмите «Старт», чтобы начать отслеживание времени
        </Text>

        <Pressable
          onPress={() => setShowStart(true)}
          className="mt-8 rounded-2xl bg-timer-active px-10 py-4"
        >
          <Text className="text-lg font-bold text-white">▶ Старт</Text>
        </Pressable>
      </View>
    </View>
  );
}
