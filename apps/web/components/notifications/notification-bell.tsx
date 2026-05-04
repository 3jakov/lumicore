'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, CheckCheck, Clock, Loader2 } from 'lucide-react';
import { NotificationType, type NotificationSummary } from '@lumicore/shared-types';

import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/use-notifications';
import { useTranslation } from '@/hooks/use-translation';
import { queryKeys } from '@/lib/query/query-keys';
import { socketClient } from '@/lib/socket';

function notificationTextKey(type: NotificationType) {
  switch (type) {
    case NotificationType.TimerForgottenStart:
      return 'notifications.timerForgottenStart' as const;
    case NotificationType.TimerForgottenStop:
      return 'notifications.timerForgottenStop' as const;
  }
}

function formatNotificationTime(value: string, language: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const locale = language === 'ru' ? 'ru-RU' : 'et-EE';

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (Number.isFinite(diffMs) && diffMs >= 0) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return relative.format(0, 'minute');
    if (minutes < 60) return relative.format(-minutes, 'minute');

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return relative.format(-hours, 'hour');
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function mergeNewNotification(
  current: NotificationSummary[] | undefined,
  notification: NotificationSummary,
): NotificationSummary[] {
  const withoutDuplicate = current?.filter((item) => item.id !== notification.id) ?? [];
  return [notification, ...withoutDuplicate].slice(0, 50);
}

export function NotificationBell(): JSX.Element {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.read_at === null).length,
    [notifications],
  );

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, []);

  useEffect(() => {
    socketClient.connect();

    function handleNotification(payload: unknown) {
      const notification = payload as NotificationSummary;
      queryClient.setQueryData<NotificationSummary[]>(
        queryKeys.notifications.mine,
        (current) => mergeNewNotification(current, notification),
      );
    }

    socketClient.on('notification:new', handleNotification);
    return () => socketClient.off('notification:new', handleNotification);
  }, [queryClient]);

  function handleNotificationClick(notification: NotificationSummary) {
    if (notification.read_at === null) {
      markRead.mutate(notification.id);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="pill relative gap-2 cursor-pointer transition hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700"
        aria-label={t('notifications.open')}
        aria-expanded={open}
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('notifications.title')}</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">{t('notifications.title')}</p>
              {unreadCount > 0 && (
                <p className="mt-0.5 text-xs text-text-muted">
                  {unreadCount} {t('notifications.unread')}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-50"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('notifications.loading')}
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-text-muted">
                <Bell className="h-6 w-6" />
                {t('notifications.empty')}
              </div>
            )}

            {!isLoading &&
              notifications.map((notification) => {
                const unread = notification.read_at === null;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-1 ${
                      unread ? 'bg-white' : 'text-text-muted'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        unread
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-surface-1 text-text-muted'
                      }`}
                    >
                      {notification.type === NotificationType.TimerForgottenStart ? (
                        <BellRing className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm ${
                          unread ? 'font-semibold text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {t(notificationTextKey(notification.type))}
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">
                        {formatNotificationTime(notification.created_at, language)}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
