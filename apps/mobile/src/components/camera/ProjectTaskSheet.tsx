import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { ProjectSummary, TaskSummary } from '@lumicore/shared-types';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';

interface Props {
  selectedProject: ProjectSummary | null;
  selectedTask: TaskSummary | null;
  onProjectSelect: (p: ProjectSummary | null) => void;
  onTaskSelect: (t: TaskSummary | null) => void;
  onClose: () => void;
  /** Which picker is open: 'project' | 'task' | null */
  mode: 'project' | 'task';
}

export function ProjectTaskSheet({
  selectedProject,
  selectedTask,
  onProjectSelect,
  onTaskSelect,
  onClose,
  mode,
}: Props) {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(
    mode === 'task' ? (selectedProject?.id ?? null) : null,
  );

  if (mode === 'project') {
    return (
      <View className="flex-1 bg-surface-0 px-4 pt-4">
        <Text className="mb-3 text-lg font-bold text-text-primary">Выбрать проект</Text>
        {loadingProjects ? (
          <ActivityIndicator color="#F59E0B" />
        ) : (
          <ScrollView>
            <Pressable
              onPress={() => { onProjectSelect(null); onClose(); }}
              className="border-b border-border py-3"
            >
              <Text className="text-text-muted">— Без проекта —</Text>
            </Pressable>
            {projects.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => { onProjectSelect(p); onClose(); }}
                className="border-b border-border py-3"
              >
                <Text className="font-medium text-text-primary">
                  {p.display_id} — {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Pressable onPress={onClose} className="mt-4 py-3">
          <Text className="text-center text-accent-500">Отмена</Text>
        </Pressable>
      </View>
    );
  }

  // mode === 'task'
  return (
    <View className="flex-1 bg-surface-0 px-4 pt-4">
      <Text className="mb-3 text-lg font-bold text-text-primary">Выбрать задачу</Text>
      {loadingTasks ? (
        <ActivityIndicator color="#F59E0B" />
      ) : (
        <ScrollView>
          <Pressable
            onPress={() => { onTaskSelect(null); onClose(); }}
            className="border-b border-border py-3"
          >
            <Text className="text-text-muted">— Без задачи —</Text>
          </Pressable>
          {tasks.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => { onTaskSelect(t); onClose(); }}
              className="border-b border-border py-3"
            >
              <Text className="font-medium text-text-primary">{t.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Pressable onPress={onClose} className="mt-4 py-3">
        <Text className="text-center text-accent-500">Отмена</Text>
      </Pressable>
    </View>
  );
}
