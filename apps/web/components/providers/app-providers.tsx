'use client';

import type { ReactNode } from 'react';

import { QueryProvider } from '@/components/providers/query-provider';

type AppProvidersProps = Readonly<{
  children: ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return <QueryProvider>{children}</QueryProvider>;
}
