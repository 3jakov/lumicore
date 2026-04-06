'use client';

import { useEffect } from 'react';

import { socketClient } from '@/lib/socket';
import { useSocketStore } from '@/store/socket.store';

export function useSocket(enabled = false): void {
  const setConnected = useSocketStore((state) => state.setConnected);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    socketClient.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socketClient.on('connect', handleConnect);
    socketClient.on('disconnect', handleDisconnect);

    return () => {
      socketClient.off('connect', handleConnect);
      socketClient.off('disconnect', handleDisconnect);
      socketClient.disconnect();
    };
  }, [enabled, setConnected]);
}
