import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: number;
  iat: number;
  exp: number;
}

@Injectable()
@WebSocketGateway({ namespace: '/', cors: { origin: process.env.SOCKET_CORS_ORIGIN } })
export class TimeTrackingGateway implements OnGatewayConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @WebSocketServer()
  server: any;

  constructor(private readonly jwtService: JwtService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleConnection(client: any): void {
    const token = client.handshake?.auth?.token as string | undefined;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      this.jwtService.verify<JwtPayload>(token);
      client.join('timers');
    } catch {
      client.disconnect();
    }
  }

  emitTimerEvent(event: string, payload: unknown): void {
    this.server.to('timers').emit(event, payload);
  }
}
