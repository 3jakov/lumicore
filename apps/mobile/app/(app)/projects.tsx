import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ProjectSummary } from '@lumicore/shared-types';
import { ProjectStatus } from '@lumicore/shared-types';

const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.Ettevalmistuses,
  ProjectStatus.Toos,
];

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: all = [], isLoading, isError, refetch } = useProjects();

  const filtered = all
    .filter((p) => (showAll ? true : ACTIVE_STATUSES.includes(p.status)))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.display_id.toLowerCase().includes(q)
      );
    });

  function renderItem({ item: p }: { item: ProjectSummary }) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/tasks',
            params: { project_id: p.id, project_name: p.name },
          })
        }
        className="mb-2 rounded-xl bg-surface-1 px-4 py-3.5"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-text-muted">{p.display_id}</Text>
          <StatusBadge status={p.status} />
        </View>
        <Text className="mt-1 text-base font-semibold text-text-primary" numberOfLines={2}>
          {p.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent-500">←</Text>
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-text-primary">Проекты</Text>
        <Pressable onPress={() => setShowAll((v) => !v)}>
          <Text className="text-sm text-accent-500">
            {showAll ? 'Только активные' : 'Все'}
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="mx-4 mb-3 rounded-xl bg-surface-1 px-4 py-2.5">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск…"
          placeholderTextColor="#9CA3AF"
          className="text-text-primary"
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#F59E0B" />
      ) : isError ? (
        <View className="mt-8 items-center">
          <Text className="text-text-muted">Ошибка загрузки</Text>
          <Pressable onPress={() => refetch()} className="mt-3">
            <Text className="text-accent-500">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-text-muted">
              {search ? 'Ничего не найдено' : 'Нет активных проектов'}
            </Text>
          }
        />
      )}
    </View>
  );
}
