/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBzXOfR_ktA8X9UcZoTxPWmUwrfOXVMYvo',
  authDomain: 'maava-7ddea.firebaseapp.com',
  projectId: 'maava-7ddea',
  storageBucket: 'maava-7ddea.firebasestorage.app',
  messagingSenderId: '595117846778',
  appId: '1:595117846778:web:1c6df2a989627d21b41943',
});

const messaging = firebase.messaging();
const seenNotifications = new Map();
const DEDUPE_WINDOW_MS = 20000;

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'New notification';
  const body = payload?.notification?.body || '';
  const dedupeKey = String(
    payload?.messageId ||
    payload?.data?.notificationId ||
    payload?.data?.id ||
    payload?.data?.orderId ||
    `${title}|${body}`
  );
  const now = Date.now();
  const lastSeen = seenNotifications.get(dedupeKey) || 0;

  if (now - lastSeen < DEDUPE_WINDOW_MS) {
    return;
  }
  seenNotifications.set(dedupeKey, now);

  // For notification payloads, FCM/browser can already display one notification in background.
  // Rendering again here causes duplicate popups.
  if (payload?.notification?.title || payload?.notification?.body) {
    return;
  }

  // Keep map small
  if (seenNotifications.size > 100) {
    for (const [key, ts] of seenNotifications.entries()) {
      if (now - ts > DEDUPE_WINDOW_MS) {
        seenNotifications.delete(key);
      }
    }
  }

  const options = {
    body,
    icon: '/vite.svg',
    data: payload?.data || {},
    tag: dedupeKey,
    renotify: false,
  };

  self.registration.showNotification(title, options);
});
