export interface NotificationPrefs {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  criticalOnly: boolean;
}

const STORAGE_KEY = 'admin_notification_prefs';
const CHANGE_EVENT = 'admin-notification-prefs-changed';

const DEFAULTS: NotificationPrefs = {
  soundEnabled: true,
  desktopNotifications: false,
  criticalOnly: false,
};

export function loadNotifPrefs(): NotificationPrefs {
  if (typeof localStorage === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveNotifPrefs(prefs: NotificationPrefs): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Notify same-tab listeners; cross-tab listeners get the native 'storage' event.
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeNotifPrefs(cb: (prefs: NotificationPrefs) => void): () => void {
  const handler = () => cb(loadNotifPrefs());
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
