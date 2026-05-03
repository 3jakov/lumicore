export enum NotificationType {
  TimerForgottenStart = 'TimerForgottenStart',
  TimerForgottenStop = 'TimerForgottenStop',
}

export interface NotificationSummary {
  id: number;
  type: NotificationType;
  read_at: string | null; // ISO 8601 or null
  created_at: string; // ISO 8601
}
