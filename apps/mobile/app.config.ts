import type { ExpoConfig, ConfigContext } from 'expo/config';
import path from 'path';

/**
 * Dynamic Expo config.
 *
 * Uses __dirname to resolve asset paths absolutely, so EAS prebuild finds
 * them regardless of which directory it runs from (monorepo root vs app root).
 *
 * EAS project ID comes from the environment so it never needs to be
 * hard-coded in the repository. Set it via:
 *
 *   - EAS Build:   add EXPO_PUBLIC_EAS_PROJECT_ID as an EAS secret
 *   - Local build: export EXPO_PUBLIC_EAS_PROJECT_ID=<uuid> before `expo start`
 */
const assets = (file: string) => path.resolve(__dirname, 'assets', file);

export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    icon: assets('icon.png'),
    splash: {
      ...config.splash,
      image: assets('splash.png'),
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: assets('adaptive-icon.png'),
        backgroundColor: '#0a0a0a',
      },
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '15510ddb-6e37-40ae-8310-7b3358724984',
      },
    },
  }) as ExpoConfig;
