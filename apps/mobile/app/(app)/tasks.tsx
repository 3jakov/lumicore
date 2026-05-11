import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectTasks } from '@/hooks/use-project-tasks';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Priority, TaskStatus } from '@lumicore/shared-types';
import type { TaskSummary } from '@lumicore/shared-types';

const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.Toos,
  TaskStatus.Teha,
  TaskStatus.Uus,
  TaskStatus.Tehtud,
];

const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.Korgeim]: '🔴',
  [Priority.Keskmine]: '🟠',
  [Priority.Madal]: '',
};

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ project_id?: string; project_name?: string }>();

  const projectId = params.project_id ? Number(params.project_id) : null;
  const projectName = params.project_name ?? null;

  const { data: tasks = [], isLoading, isError, refetch } = useProjectTasks(projectId);

  // Sort by status order, then by name
  const sorted = [...tasks].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status);
    const bi = STATUS_ORDER.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });

  function renderItem({ item: t }: { item: TaskSummary }) {
    return (
      <View className="mb-2 rounded-xl bg-surface-1 px-4 py-3.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-base font-semibold text-text-primary" numberOfLines={2}>
            {PRIORITY_LABEL[t.priority] ? `${PRIORITY_LABEL[t.priority]} ` : ''}
            {t.name}
          </Text>
          <StatusBadge kind="task" status={t.status} />
        </View>
        {(t.start_time || t.end_time) && (
          <Text className="mt-1 text-xs text-text-muted">
            {t.start_time
              ? new Date(t.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
              : '?'}
            {' → '}
            {t.end_time
              ? new Date(t.end_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
              : '?'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent-500">←</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-text-primary">Задачи</Text>
          {projectName && (
            <Text className="text-xs text-text-muted" numberOfLines={1}>
              {projectName}
            </Text>
          )}
        </View>
        <Text className="text-sm text-text-muted">{tasks.length}</Text>
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
          data={sorted}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-text-muted">
              {projectId ? 'Нет задач в этом проекте' : 'Нет задач'}
            </Text>
          }
        />
      )}
    </View>
  );
}
