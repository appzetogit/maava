import { useEffect } from 'react';
import { toast } from 'sonner';
import { firebaseApp } from '@/lib/firebase';

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

        // In-app popup for active sessions
        toast(title, {
          description: body,
          duration: 5000,
        });

        // Remove explicit browser notification during active session to prevent double notifications.
        // It's already handled via toast. Background messages are naturally handled by service worker.
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
