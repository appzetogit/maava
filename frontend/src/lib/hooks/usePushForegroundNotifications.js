import { useEffect } from 'react';
import { toast } from 'sonner';
import { firebaseApp } from '@/lib/firebase';

const DEDUPE_WINDOW_MS = 20000;

const getPayloadKey = (payload, title, body) => {
  return (
    payload?.messageId ||
    payload?.data?.notificationId ||
    payload?.data?.id ||
    payload?.data?.orderId ||
    `${title}|${body}`
  );
};

const shouldSkipDuplicate = (key) => {
  try {
    const storageKey = '__push_last_seen__';
    const now = Date.now();
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    const seenAt = parsed?.[key] || 0;

    if (now - seenAt < DEDUPE_WINDOW_MS) return true;

    const next = { ...parsed, [key]: now };
    const keys = Object.keys(next);
    if (keys.length > 50) {
      keys.sort((a, b) => next[b] - next[a]);
      const trimmed = {};
      keys.slice(0, 30).forEach((k) => { trimmed[k] = next[k]; });
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
  } catch {
    // Ignore localStorage failures and continue.
  }
  return false;
};

export default function usePushForegroundNotifications() {
  useEffect(() => {
    let unsubscribe;

    const setupForegroundListener = async () => {
      if (typeof window === 'undefined') return;
      if (!('Notification' in window)) return;

      const { isSupported, getMessaging, onMessage } = await import('firebase/messaging');
      const supported = await isSupported();
      if (!supported) return;

      const messaging = getMessaging(firebaseApp);

      unsubscribe = onMessage(messaging, async (payload) => {
        const title = payload?.notification?.title || payload?.data?.title || 'New notification';
        const body = payload?.notification?.body || payload?.data?.body || payload?.data?.description || '';
        const data = payload?.data || {};
        const icon = payload?.notification?.icon || '/vite.svg';
        const dedupeKey = getPayloadKey(payload, title, body);
        if (shouldSkipDuplicate(dedupeKey)) return;

        // Show exactly one notification in foreground.
        // Prefer OS-level notification; fall back to in-app toast only if OS permission is unavailable.
        if (Notification.permission === 'granted') {
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.showNotification(title, {
                body,
                icon,
                data,
                tag: String(dedupeKey),
                renotify: false,
              });
            } else {
              new Notification(title, { body, icon, data });
            }
          } catch (err) {
            console.warn('Foreground system notification failed:', err?.message || err);
            toast(title, {
              description: body,
              duration: 5000,
            });
          }
        } else {
          toast(title, {
            description: body,
            duration: 5000,
          });
        }
      });
    };

    setupForegroundListener().catch((error) => {
      console.warn('Foreground notification listener not initialized:', error?.message || error);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);
}
