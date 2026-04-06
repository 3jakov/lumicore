'use client';

import { io, type Socket } from 'socket.io-client';

import { env } from '@/lib/config/env';

type ServerEvents = Record<string, never>;
type ClientEvents = Record<string, never>;

class SocketClient {
  private socket: Socket<ServerEvents, ClientEvents> | null = null;

  connect(): Socket<ServerEvents, ClientEvents> {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(env.wsUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });

    this.socket.connect();

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    this.socket?.on(event, handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.socket?.off(event, handler);
  }
}

export const socketClient = new SocketClient();
