import { useEffect } from 'react';
import { notificationAPI } from '@/lib/api';
import { firebaseApp } from '@/lib/firebase';

const REGISTRATION_CACHE_KEY = 'fcm_registration_cache_v1';

const getCurrentModuleRole = (path) => {
  if (path.startsWith('/restaurant') && !path.startsWith('/restaurants')) {
    return localStorage.getItem('restaurant_accessToken') ? 'restaurant' : null;
  }

  if (path.startsWith('/delivery')) {
    return localStorage.getItem('delivery_accessToken') ? 'delivery' : null;
  }

  if (path.startsWith('/admin')) {
    return null;
  }

  return localStorage.getItem('user_accessToken') ? 'user' : null;
};

const isWebPushSupported = async () => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;

  const { isSupported } = await import('firebase/messaging');
  return isSupported();
};

export default function usePushRegistration(pathname) {
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const registerPushToken = async () => {
      const role = getCurrentModuleRole(pathname);
      if (!role) return false;

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_FIREBASE_VAPID_KEY is missing. Web push token registration skipped.');
        return false;
      }

      const supported = await isWebPushSupported();
      if (!supported || !mounted) return false;

      if (Notification.permission === 'denied') return false;

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || !mounted) return false;
      }

      const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const { getMessaging, getToken } = await import('firebase/messaging');
      const messaging = getMessaging(firebaseApp);
      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
      });

      if (!fcmToken || !mounted) return false;

      const cacheRaw = localStorage.getItem(REGISTRATION_CACHE_KEY);
      const cache = cacheRaw ? JSON.parse(cacheRaw) : {};

      if (cache.role === role && cache.token === fcmToken) return true;

      await notificationAPI.registerFCMToken(fcmToken, role);
      localStorage.setItem(REGISTRATION_CACHE_KEY, JSON.stringify({ role, token: fcmToken }));
      return true;
    };

    const attemptRegistration = () => registerPushToken().catch((error) => {
      console.warn('Push token registration skipped:', error?.message || error);
    });

    // First attempt immediately
    attemptRegistration();

    // Retry periodically because login often happens on same route without pathname change
    intervalId = window.setInterval(() => {
      if (!mounted) return;
      attemptRegistration();
    }, 15000);

    // Retry on focus/visibility regain
    const onFocus = () => attemptRegistration();
    const onVisible = () => {
      if (document.visibilityState === 'visible') attemptRegistration();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]);
}
