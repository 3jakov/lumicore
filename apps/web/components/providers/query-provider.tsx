'use client';

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { createQueryClient } from '@/lib/query/query-client';

type QueryProviderProps = Readonly<{
  children: ReactNode;
}>;

export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  const [queryClient] = useState<QueryClient>(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
