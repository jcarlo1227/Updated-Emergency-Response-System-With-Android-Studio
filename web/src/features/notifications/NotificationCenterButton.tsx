import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, AlertTriangle, Ambulance, BellRing } from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import type { AdminNotification } from './types';
import { cn, fmt } from '@/lib/utils';

export function NotificationCenterButton() {
  const { list, unreadCount, acknowledge, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-[150] w-[400px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-50">
            {list.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              list.map((n) => (
                <NotificationRow
                  key={n.id}
                  notif={n}
                  onAck={() => void acknowledge(n.id)}
                  onOpen={() => {
                    setOpen(false);
                    if (n.type === 'emergency') {
                      navigate('/map');
                    } else if (n.type === 'ambulance') {
                      navigate('/ambulance-requests');
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notif,
  onAck,
  onOpen,
}: {
  notif: AdminNotification;
  onAck: () => void;
  onOpen: () => void;
}) {
  const Icon =
    notif.type === 'ambulance' ? Ambulance : notif.type === 'emergency' ? AlertTriangle : BellRing;
  const iconColor =
    notif.priority === 'critical'
      ? 'text-red-600'
      : notif.priority === 'high'
        ? 'text-amber-600'
        : 'text-slate-500';
  const isUnread = notif.status === 'unread';
  return (
    <div
      className={cn(
        'px-4 py-3 hover:bg-slate-50 transition-colors',
        isUnread && 'bg-blue-50/30',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm text-slate-900 truncate',
                isUnread ? 'font-bold' : 'font-medium',
              )}
            >
              {notif.title}
            </h4>
            {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
            {notif.status === 'acknowledged' && (
              <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-600 mt-0.5 break-words">{notif.message}</p>
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-[11px] text-slate-400">{fmt(notif.createdAt)}</span>
            <div className="flex gap-2">
              <button
                onClick={onOpen}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Open
              </button>
              {notif.status !== 'acknowledged' && (
                <button
                  onClick={onAck}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
