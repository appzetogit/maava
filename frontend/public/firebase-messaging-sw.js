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

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'New notification';
  const options = {
    body: payload?.notification?.body || '',
    icon: '/vite.svg',
    data: payload?.data || {},
  };

  self.registration.showNotification(title, options);
});
