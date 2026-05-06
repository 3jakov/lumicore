import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center justify-center bg-surface-0" style={{ paddingTop: insets.top }}>
      <Text className="text-2xl font-bold text-text-primary">Задачи</Text>
      <Text className="mt-2 text-sm text-text-muted">— M3 —</Text>
      <Pressable onPress={() => router.back()} className="mt-8">
        <Text className="text-accent-500">← Назад</Text>
      </Pressable>
    </View>
  );
}
