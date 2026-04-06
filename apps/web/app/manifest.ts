import type { MetadataRoute } from 'next';

import { appManifest } from '@/lib/pwa/manifest';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appManifest.name,
    short_name: appManifest.shortName,
    description: appManifest.description,
    start_url: '/',
    display: 'standalone',
    background_color: appManifest.backgroundColor,
    theme_color: appManifest.themeColor,
    lang: 'et',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
