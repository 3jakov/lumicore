// Thin wrapper around expo-server-sdk so the cron stays testable.
import { Injectable, Logger } from '@nestjs/common';
import Expo, { type ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class ExpoPushService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(ExpoPushService.name);

  async sendToTokens(tokens: string[], message: Omit<ExpoPushMessage, 'to'>): Promise<void> {
    const valid = tokens.filter((t) => Expo.isExpoPushToken(t));
    if (valid.length === 0) return;

    const messages: ExpoPushMessage[] = valid.map((to) => ({ ...message, to }));
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        for (const receipt of receipts) {
          if (receipt.status === 'error') {
            this.logger.warn(`Push error: ${receipt.message} (${receipt.details?.error ?? ''})`);
          }
        }
      } catch (err) {
        this.logger.error('Failed to send push chunk', err);
      }
    }
  }
}
