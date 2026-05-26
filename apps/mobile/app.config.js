const path = require('path');
const { withAndroidManifest } = require('@expo/config-plugins');

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
const assets = (file) => path.resolve(__dirname, 'assets', file);

/**
 * Inline config plugin: set android:usesCleartextTraffic="true" so that
 * HTTP (non-HTTPS) requests to the dev/preview API server are allowed.
 * Android 9+ blocks cleartext HTTP by default; this restores it for builds
 * that target a local or staging server over plain HTTP.
 */
const withCleartextTraffic = (config) =>
  withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (app) app.$['android:usesCleartextTraffic'] = 'true';
    return c;
  });

const IS_PRODUCTION = process.env.APP_ENV === 'production';

const baseConfig = (config) => ({
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
    apiUrl: process.env.API_URL ?? config.extra?.apiUrl ?? 'http://localhost:3001/api/v1',
    wsUrl:  process.env.WS_URL  ?? config.extra?.wsUrl  ?? 'ws://localhost:3001',
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '15510ddb-6e37-40ae-8310-7b3358724984',
    },
  },
});

module.exports = ({ config }) => {
  const configured = baseConfig(config);
  // Only enable cleartext traffic for non-production builds (dev/preview use HTTP)
  if (IS_PRODUCTION) return configured;
  return withCleartextTraffic(configured);
};
