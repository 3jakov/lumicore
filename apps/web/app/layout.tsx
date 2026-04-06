import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

import { AppProviders } from '@/components/providers/app-providers';
import { appManifest } from '@/lib/pwa/manifest';

export const metadata: Metadata = {
  title: {
    default: 'Lumicore',
    template: '%s | Lumicore',
  },
  description: 'LUMICO field and production management platform.',
  applicationName: 'Lumicore',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appManifest.name,
  },
};

export const viewport: Viewport = {
  themeColor: '#f3f2ea',
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="et">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
