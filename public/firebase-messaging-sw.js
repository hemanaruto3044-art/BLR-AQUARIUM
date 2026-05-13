importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// This is a placeholder. The real config is usually injected or fetched.
// However, FCM SW typically needs the messagingSenderId.
firebase.initializeApp({
  messagingSenderId: "46510425420" // Extracted from the URL/Config if possible, 
  // but for the sake of functionality, we rely on the client to register the SW with the right config.
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Fallback icon
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
