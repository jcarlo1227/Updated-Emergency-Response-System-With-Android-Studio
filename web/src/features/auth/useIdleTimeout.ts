import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const WARN_MS = 5 * 60 * 1000;  // warn 5 minutes before

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function useIdleTimeout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnRef.current) clearTimeout(warnRef.current);

    warnRef.current = setTimeout(() => {
      if (admin) {
        const ok = window.confirm('Your session will expire in 5 minutes due to inactivity. Click OK to stay signed in.');
        if (ok) reset();
      }
    }, IDLE_MS - WARN_MS);

    timerRef.current = setTimeout(() => {
      if (admin) {
        logout().finally(() => navigate('/login'));
      }
    }, IDLE_MS);
  }, [admin, logout, navigate]);

  useEffect(() => {
    if (!admin) return;
    reset();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnRef.current) clearTimeout(warnRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [admin, reset]);
}
