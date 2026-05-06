import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth.store';
import { colors } from '@/theme/colors';

// ─── Tile data ────────────────────────────────────────────────────────────────

const TILES = [
  { label: 'Трекер',    emoji: '⏱',  route: '/(app)/timer'     },
  { label: 'Проекты',   emoji: '📋',  route: '/(app)/projects'  },
  { label: 'Задачи',    emoji: '✅',  route: '/(app)/tasks'     },
  { label: 'Команда',   emoji: '👥',  route: '/(app)/team'      },
  { label: 'Фото',      emoji: '📷',  route: '/(app)/photos'    },
  { label: 'Документы', emoji: '📄',  route: '/(app)/documents' },
] as const;

// ─── Tile ─────────────────────────────────────────────────────────────────────

function Tile({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center gap-2 rounded-3xl bg-surface-card py-6 active:opacity-70"
      style={{ minHeight: 100 }}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text className="text-sm font-semibold text-text-primary">{label}</Text>
    </Pressable>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuthStore();

  return (
    <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Lumicore
          </Text>
          <Text className="mt-0.5 text-lg font-bold text-text-primary">
            {currentUser?.full_name ?? '—'}
          </Text>
        </View>

        {/* Avatar */}
        <Pressable onPress={() => void logout()} hitSlop={12}>
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: currentUser?.avatar_color ?? colors.borderStrong }}
          >
            <Text className="text-sm font-bold text-white">
              {currentUser?.initials ?? '?'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Tile grid */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          {/* Row 1 */}
          <View className="flex-row gap-3">
            <Tile {...TILES[0]} onPress={() => router.push(TILES[0].route)} />
            <Tile {...TILES[1]} onPress={() => router.push(TILES[1].route)} />
          </View>
          {/* Row 2 */}
          <View className="flex-row gap-3">
            <Tile {...TILES[2]} onPress={() => router.push(TILES[2].route)} />
            <Tile {...TILES[3]} onPress={() => router.push(TILES[3].route)} />
          </View>
          {/* Row 3 */}
          <View className="flex-row gap-3">
            <Tile {...TILES[4]} onPress={() => router.push(TILES[4].route)} />
            <Tile {...TILES[5]} onPress={() => router.push(TILES[5].route)} />
          </View>
        </View>
      </ScrollView>

      {/* FABs */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-end justify-center gap-6 px-8"
        style={{ paddingBottom: insets.bottom + 24 }}
        pointerEvents="box-none"
      >
        {/* Camera FAB */}
        <Pressable
          onPress={() => router.push('/(app)/camera')}
          className="h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg active:opacity-80"
        >
          <Text style={{ fontSize: 26 }}>📷</Text>
        </Pressable>

        {/* Timer FAB */}
        <Pressable
          onPress={() => router.push('/(app)/timer')}
          className="h-20 w-20 items-center justify-center rounded-full shadow-lg active:opacity-80"
          style={{ backgroundColor: colors.timerActive }}
        >
          <Text style={{ fontSize: 30 }}>▶</Text>
        </Pressable>
      </View>
    </View>
  );
}
