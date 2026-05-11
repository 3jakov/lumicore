import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyPhotos } from '@/hooks/use-my-photos';
import type { PhotoSummary } from '@lumicore/shared-types';

const GAP = 2;
const COLS = 3;

export default function PhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cellSize = (width - GAP * (COLS + 1)) / COLS;

  const { data, isLoading, isError, refetch } = useMyPhotos();
  const photos = data?.data ?? [];

  function renderItem({ item: p }: { item: PhotoSummary }) {
    const uri = p.thumbnail_url ?? p.url;
    return (
      <View style={{ width: cellSize, height: cellSize, margin: GAP / 2 }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {p.gps_lat != null && (
          <View className="absolute bottom-1 right-1 rounded bg-black/50 px-1">
            <Text className="text-[9px] text-white">📍</Text>
          </View>
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
        <Text className="flex-1 text-xl font-bold text-text-primary">Мои фото</Text>
        <Pressable
          onPress={() => router.push('/(app)/camera')}
          className="rounded-xl bg-surface-2 px-3 py-1.5"
        >
          <Text className="text-sm font-semibold text-accent-500">+ Фото</Text>
        </Pressable>
      </View>

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
          data={photos}
          keyExtractor={(p) => String(p.id)}
          numColumns={COLS}
          renderItem={renderItem}
          contentContainerStyle={{ padding: GAP / 2, paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={
            <View className="mt-16 items-center px-8">
              <Text className="text-4xl">📷</Text>
              <Text className="mt-3 text-center text-base font-semibold text-text-primary">
                Фото пока нет
              </Text>
              <Text className="mt-1 text-center text-sm text-text-muted">
                Нажмите «+ Фото» чтобы сделать первый снимок
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
