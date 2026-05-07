import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/services/apiClient';
import { getSocket } from '@/services/socketClient';
import { useAuth } from '@/features/auth/useAuth';
import { playAlert } from './alertSound';
import { loadNotifPrefs, subscribeNotifPrefs, type NotificationPrefs } from './prefs';
import type { AdminNotification } from './types';

interface NotificationContextValue {
  list: AdminNotification[];
  unreadCount: number;
  toasts: AdminNotification[];
  dismissToast: (id: string) => void;
  acknowledge: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const TOAST_AUTO_DISMISS_MS = 12_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';

  const [list, setList] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<AdminNotification[]>([]);
  const toastTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const prefsRef = useRef<NotificationPrefs>(loadNotifPrefs());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = toastTimers.current[id];
    if (t) {
      clearTimeout(t);
      delete toastTimers.current[id];
    }
  }, []);

  const queueToast = useCallback(
    (notif: AdminNotification) => {
      setToasts((prev) => {
        if (prev.some((t) => t.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 5);
      });
      const timer = setTimeout(
        () => dismissToast(notif.id),
        notif.priority === 'critical' ? TOAST_AUTO_DISMISS_MS * 2 : TOAST_AUTO_DISMISS_MS,
      );
      toastTimers.current[notif.id] = timer;
    },
    [dismissToast],
  );

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get<{
        data: { items: AdminNotification[]; unreadCount: number };
      }>('/admin/notifications?status=all&limit=50');
      setList(data.data.items);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // ignore — will retry on next event
    }
  }, [isAdmin]);

  const acknowledge = useCallback(
    async (id: string) => {
      try {
        await api.patch(`/admin/notifications/${id}/ack`);
        setList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: 'acknowledged' } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
      dismissToast(id);
    },
    [dismissToast],
  );

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/admin/notifications/mark-all-read');
      setList((prev) =>
        prev.map((n) => (n.status === 'unread' ? { ...n, status: 'read' } : n)),
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setList([]);
      setUnreadCount(0);
      setToasts([]);
      return;
    }
    void refresh();
  }, [isAdmin, refresh]);

  useEffect(() => {
    return subscribeNotifPrefs((p) => {
      prefsRef.current = p;
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const socket = getSocket();
    if (!socket) return;

    const onCreated = (notif: AdminNotification) => {
      setList((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 200);
      });
      setUnreadCount((c) => c + 1);

      const prefs = prefsRef.current;
      const isCritical = notif.priority === 'critical';
      const shouldSurface = !prefs.criticalOnly || isCritical;

      if (shouldSurface) {
        queueToast(notif);
      }
      if (prefs.soundEnabled && shouldSurface) {
        playAlert(notif.priority);
      }
      if (
        prefs.desktopNotifications &&
        shouldSurface &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        document.visibilityState === 'hidden'
      ) {
        try {
          new Notification(notif.title, {
            body: notif.message,
            tag: notif.id,
          });
        } catch {
          // Ignore browsers that throw on Notification construction.
        }
      }
    };

    socket.on('admin_notification.created', onCreated);
    return () => {
      socket.off('admin_notification.created', onCreated);
    };
  }, [isAdmin, queueToast]);

  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach(clearTimeout);
      toastTimers.current = {};
    };
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ list, unreadCount, toasts, dismissToast, acknowledge, markAllRead, refresh }),
    [list, unreadCount, toasts, dismissToast, acknowledge, markAllRead, refresh],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return ctx;
}
