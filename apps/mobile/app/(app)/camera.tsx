import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProjectSummary, TaskSummary } from '@lumicore/shared-types';
import { ProjectTaskSheet } from '@/components/camera/ProjectTaskSheet';
import { useUploadPhoto } from '@/hooks/use-upload-photo';

type Sheet = 'project' | 'task' | null;
type Mode = 'viewfinder' | 'preview';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  // ── Permissions ────────────────────────────────────────────────────────────
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationGranted(status === 'granted');
    });
  }, []);

  // ── State machine ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('viewfinder');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  // GPS promise started at capture time, awaited on confirm
  const gpsRef = useRef<Promise<Location.LocationObject | null>>(Promise.resolve(null));

  const upload = useUploadPhoto();

  // ── Capture ────────────────────────────────────────────────────────────────
  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const takenAt = new Date().toISOString();

      // Start GPS in background so it runs while user reviews the photo
      if (locationGranted) {
        gpsRef.current = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);
      }

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setCapturedUri(photo.uri);
      setCapturedAt(takenAt);
      setMode('preview');
    } finally {
      setCapturing(false);
    }
  }

  // ── Confirm upload ─────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!capturedUri) return;

    // Wait for GPS — give at most 3 s from when user taps Confirm
    const gps = await Promise.race([
      gpsRef.current,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    upload.mutate(
      {
        uri: capturedUri,
        takenAt: capturedAt,
        projectId: selectedProject?.id ?? null,
        taskId: selectedTask?.id ?? null,
        gpsLat: gps?.coords.latitude ?? null,
        gpsLng: gps?.coords.longitude ?? null,
      },
      {
        onSuccess: () => {
          setSuccessCount((n) => n + 1);
          setCapturedUri(null);
          setMode('viewfinder');
          upload.reset();
        },
      },
    );
  }

  function handleRetake() {
    setCapturedUri(null);
    setMode('viewfinder');
    upload.reset();
  }

  // ── Permission screens ─────────────────────────────────────────────────────
  if (!cameraPermission) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-0">
        <ActivityIndicator color="#F59E0B" />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View
        className="flex-1 items-center justify-center bg-surface-0 px-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-lg font-bold text-text-primary">
          Нет доступа к камере
        </Text>
        <Text className="mt-2 text-center text-sm text-text-muted">
          Разрешите доступ к камере в настройках устройства.
        </Text>
        <Pressable
          onPress={requestCameraPermission}
          className="mt-6 rounded-xl bg-accent-500 px-8 py-3"
        >
          <Text className="font-semibold text-white">Разрешить</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4 py-2">
          <Text className="text-accent-500">← Назад</Text>
        </Pressable>
      </View>
    );
  }

  // ── Picker sheet overlay ───────────────────────────────────────────────────
  if (sheet !== null) {
    return (
      <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>
        <ProjectTaskSheet
          mode={sheet}
          selectedProject={selectedProject}
          selectedTask={selectedTask}
          onProjectSelect={(p) => {
            setSelectedProject(p);
            setSelectedTask(null);
          }}
          onTaskSelect={setSelectedTask}
          onClose={() => setSheet(null)}
        />
      </View>
    );
  }

  // ── Preview (review captured photo before upload) ──────────────────────────
  if (mode === 'preview' && capturedUri) {
    return (
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        {/* Full-screen preview image */}
        <Image
          source={{ uri: capturedUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Top bar */}
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable
            onPress={handleRetake}
            className="rounded-xl bg-black/50 px-4 py-2"
          >
            <Text className="font-semibold text-white">↩ Переснять</Text>
          </Pressable>
          {successCount > 0 && (
            <View className="rounded-full bg-timer-active px-3 py-1">
              <Text className="text-xs font-bold text-white">
                ✓ {successCount} фото
              </Text>
            </View>
          )}
        </View>

        {/* Bottom panel */}
        <View className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 pb-8 pt-4">
          {/* Project selector */}
          <Text className="mb-1 text-xs uppercase tracking-widest text-white/60">
            Проект (необязательно)
          </Text>
          <Pressable
            onPress={() => setSheet('project')}
            className="mb-3 rounded-xl bg-white/10 px-4 py-3"
          >
            <Text className="text-white">
              {selectedProject
                ? `${selectedProject.display_id} — ${selectedProject.name}`
                : 'Выбрать проект…'}
            </Text>
          </Pressable>

          {/* Task selector — only when project chosen */}
          {selectedProject && (
            <>
              <Text className="mb-1 text-xs uppercase tracking-widest text-white/60">
                Задача (необязательно)
              </Text>
              <Pressable
                onPress={() => setSheet('task')}
                className="mb-3 rounded-xl bg-white/10 px-4 py-3"
              >
                <Text className="text-white">
                  {selectedTask ? selectedTask.name : 'Выбрать задачу…'}
                </Text>
              </Pressable>
            </>
          )}

          {/* Upload error */}
          {upload.error && (
            <Text className="mb-2 text-sm text-timer-stop">
              {upload.error.message}
            </Text>
          )}

          {/* Confirm button */}
          <Pressable
            onPress={handleConfirm}
            disabled={upload.isPending}
            className="rounded-2xl bg-timer-active py-4"
          >
            {upload.isPending ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="font-bold text-white">Загрузка…</Text>
              </View>
            ) : (
              <Text className="text-center text-base font-bold text-white">
                ✓ Сохранить фото
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Viewfinder ─────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />

      {/* Top bar */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl bg-black/50 px-4 py-2"
        >
          <Text className="font-semibold text-white">← Назад</Text>
        </Pressable>
        {successCount > 0 && (
          <View className="rounded-full bg-timer-active px-3 py-1">
            <Text className="text-xs font-bold text-white">✓ {successCount} фото</Text>
          </View>
        )}
      </View>

      {/* GPS indicator */}
      <View className="absolute right-4 top-20">
        <Text className="text-xs text-white/50">
          {locationGranted ? '📍 GPS' : '📍 без GPS'}
        </Text>
      </View>

      {/* Shutter button */}
      <View
        className="absolute bottom-0 left-0 right-0 items-center pb-12"
        style={{ paddingBottom: insets.bottom + 32 }}
      >
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20"
        >
          {capturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="h-14 w-14 rounded-full bg-white" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
