import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '@/lib/api-client';

// Show notifications as banner + sound even while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Physical device required — Expo Go simulator returns a token but it won't
  // deliver to APNs/FCM. We guard here to avoid registering simulator tokens.
  if (!Constants.isDevice) return null;

  // Android: create a notification channel (required for SDK 26+).
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Lumicore',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data; // e.g. "ExponentPushToken[xxx]"
}

/**
 * Call once (inside authenticated layout) to:
 * 1. Request push permission
 * 2. Obtain Expo push token
 * 3. Register it with the backend (POST /notifications/device-token)
 */
export function usePushNotifications(): void {
  useEffect(() => {
    let cancelled = false;

    registerForPushNotificationsAsync()
      .then((token) => {
        if (cancelled || !token) return;
        // Fire-and-forget — a registration failure should never crash the app.
        apiClient
          .post('/notifications/device-token', { body: { token } })
          .catch(() => { /* silently ignore */ });
      })
      .catch(() => { /* permission denied or simulator */ });

    return () => { cancelled = true; };
  }, []);
}
