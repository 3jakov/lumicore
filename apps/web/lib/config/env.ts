function readPublicEnv(
  name: 'NEXT_PUBLIC_API_URL' | 'NEXT_PUBLIC_WS_URL',
  fallback: string,
): string {
  const value = process.env[name];

  return value && value.length > 0 ? value : fallback;
}

export const env = {
  apiUrl: readPublicEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'),
  wsUrl: readPublicEnv('NEXT_PUBLIC_WS_URL', 'ws://localhost:3001'),
} as const;
