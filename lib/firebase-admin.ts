// lib/firebase-admin.ts
// Server-side ONLY — never import into client components.
// Firebase Admin SDK for sending FCM push notifications.

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin (singleton)
function getFirebaseAdmin(): App | null {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Try the user's template key first, then fallback to original key
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    console.warn(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT not set — push notifications disabled"
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (err) {
    console.error("Firebase Admin init failed:", err);
    return null;
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  itemId?: string;
}

export async function sendPushNotification(
  fcmToken: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error: string | null }> {
  try {
    const app = getFirebaseAdmin();
    if (!app) {
      return {
        success: false,
        error: "Firebase Admin not initialized — push disabled",
      };
    }

    const messaging = getMessaging(app);

    await messaging.send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        },
        fcmOptions: {
          link: payload.itemId ? `/items/${payload.itemId}` : "/",
        },
      },
      data: {
        itemId: payload.itemId ?? "",
      },
    });

    return { success: true, error: null };
  } catch (err) {
    console.error("FCM send failed:", err);
    return {
      success: false,
      error: "Push notification failed — match still saved",
    };
  }
}
