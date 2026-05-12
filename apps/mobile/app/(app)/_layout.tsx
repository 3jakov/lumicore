import { Stack } from 'expo-router';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function AppLayout() {
  // Register Expo push token once per authenticated session.
  usePushNotifications();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
        animation: 'slide_from_right',
      }}
    />
  );
}
