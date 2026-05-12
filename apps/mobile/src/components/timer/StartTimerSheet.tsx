import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import type { ProjectSummary, TaskSummary } from '@lumicore/shared-types';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useStartTimer } from '@/hooks/use-active-timer';

interface Props {
  onStarted: () => void;
}

export function StartTimerSheet({ onStarted }: Props) {
  const [noProject, setNoProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [reason, setReason] = useState('');
  const [pickingProject, setPickingProject] = useState(false);
  const [pickingTask, setPickingTask] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    selectedProject?.id ?? null,
  );
  const start = useStartTimer();

  const reasonOk = reason.trim().length >= 10;
  const canStart = noProject ? reasonOk : selectedProject != null;

  function handleStart() {
    if (!canStart) return;
    start.mutate(
      noProject
        ? { no_project_reason: reason.trim() }
        : {
            project_id: selectedProject!.id,
            task_id: selectedTask?.id ?? null,
          },
      { onSuccess: onStarted },
    );
  }

  // ── Project picker overlay ─────────────────────────────────────────────────
  if (pickingProject) {
    return (
      <View className="flex-1 bg-surface-0 px-4 pt-4">
        <Text className="mb-3 text-lg font-bold text-text-primary">Выбрать проект</Text>
        {projectsLoading ? (
          <ActivityIndicator color="#F59E0B" />
        ) : (
          <ScrollView>
            {projects.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelectedProject(p);
                  setSelectedTask(null);
                  setPickingProject(false);
                }}
                className="border-b border-border py-3"
              >
                <Text className="font-medium text-text-primary">{p.display_id} — {p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Pressable onPress={() => setPickingProject(false)} className="mt-4 py-3">
          <Text className="text-center text-accent-500">Отмена</Text>
        </Pressable>
      </View>
    );
  }

  // ── Task picker overlay ────────────────────────────────────────────────────
  if (pickingTask) {
    return (
      <View className="flex-1 bg-surface-0 px-4 pt-4">
        <Text className="mb-3 text-lg font-bold text-text-primary">Выбрать задачу</Text>
        {tasksLoading ? (
          <ActivityIndicator color="#F59E0B" />
        ) : (
          <ScrollView>
            <Pressable
              onPress={() => {
                setSelectedTask(null);
                setPickingTask(false);
              }}
              className="border-b border-border py-3"
            >
              <Text className="text-text-muted">— Без задачи —</Text>
            </Pressable>
            {tasks.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setSelectedTask(t);
                  setPickingTask(false);
                }}
                className="border-b border-border py-3"
              >
                <Text className="font-medium text-text-primary">{t.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Pressable onPress={() => setPickingTask(false)} className="mt-4 py-3">
          <Text className="text-center text-accent-500">Отмена</Text>
        </Pressable>
      </View>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-surface-0 px-4 pt-6">
      <Text className="mb-6 text-xl font-bold text-text-primary">Начать таймер</Text>

      {/* No-project toggle */}
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="text-base text-text-primary">Без проекта</Text>
        <Switch
          value={noProject}
          onValueChange={(v) => {
            setNoProject(v);
            setSelectedProject(null);
            setSelectedTask(null);
          }}
          trackColor={{ true: '#F59E0B' }}
        />
      </View>

      {!noProject && (
        <>
          {/* Project selector */}
          <Text className="mb-1 text-xs font-medium uppercase tracking-widest text-text-muted">
            Проект
          </Text>
          <Pressable
            onPress={() => setPickingProject(true)}
            className="mb-4 rounded-xl bg-surface-1 px-4 py-3.5"
          >
            <Text className={selectedProject ? 'text-text-primary' : 'text-text-muted'}>
              {selectedProject
                ? `${selectedProject.display_id} — ${selectedProject.name}`
                : 'Выбрать проект…'}
            </Text>
          </Pressable>

          {/* Task selector (only when project chosen) */}
          {selectedProject && (
            <>
              <Text className="mb-1 text-xs font-medium uppercase tracking-widest text-text-muted">
                Задача (необязательно)
              </Text>
              <Pressable
                onPress={() => setPickingTask(true)}
                className="mb-4 rounded-xl bg-surface-1 px-4 py-3.5"
              >
                <Text className={selectedTask ? 'text-text-primary' : 'text-text-muted'}>
                  {selectedTask ? selectedTask.name : 'Выбрать задачу…'}
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {noProject && (
        <>
          <Text className="mb-1 text-xs font-medium uppercase tracking-widest text-text-muted">
            Причина (мин. 10 символов)
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Объясните, почему нет проекта…"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={3}
            className="mb-4 rounded-xl bg-surface-1 px-4 py-3 text-text-primary"
          />
          {reason.length > 0 && reason.trim().length < 10 && (
            <Text className="mb-3 text-xs text-timer-stop">
              Минимум 10 символов ({reason.trim().length}/10)
            </Text>
          )}
        </>
      )}

      {/* API error */}
      {start.error && (
        <Text className="mb-3 text-sm text-timer-stop">{start.error.message}</Text>
      )}

      {/* Start button */}
      <Pressable
        onPress={handleStart}
        disabled={!canStart || start.isPending}
        className={`mt-auto rounded-xl py-4 ${canStart ? 'bg-timer-active' : 'bg-surface-2'}`}
      >
        {start.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            className={`text-center text-base font-bold ${canStart ? 'text-white' : 'text-text-muted'}`}
          >
            ▶ Старт
          </Text>
        )}
      </Pressable>
    </View>
  );
}
