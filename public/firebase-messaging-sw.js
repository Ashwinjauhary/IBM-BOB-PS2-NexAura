// public/firebase-messaging-sw.js
// Handles push notifications while the app is closed/backgrounded.
// Must live at the root of /public so it's served from the site root.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Lost & Found update", {
    body: body || "You have a new match.",
    icon: icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data || {},
  });
});

// Bring the app to focus / open a specific item when tapped
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const itemId = event.notification.data?.itemId;
  const url = itemId ? `/items/${itemId}` : "/";
  event.waitUntil(clients.openWindow(url));
});
