import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config.
 *
 * EAS project ID comes from the environment so it never needs to be
 * hard-coded in the repository. Set it via:
 *
 *   - EAS Build:   add EXPO_PUBLIC_EAS_PROJECT_ID as an EAS secret
 *   - Local build: export EXPO_PUBLIC_EAS_PROJECT_ID=<uuid> before `expo start`
 *
 * The static app.json remains the source of truth for all other fields;
 * this file only overrides `extra.eas.projectId`.
 */
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    extra: {
      ...config.extra,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'REPLACE_WITH_EAS_PROJECT_ID',
      },
    },
  }) as ExpoConfig;
