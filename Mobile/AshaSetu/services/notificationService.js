// Mobile/AshaSetu/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiConfig, makeRequest } from '../config/api';

// ── Notification handler (controls foreground behaviour) ─────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// registerForPushNotifications
//
// Strategy:
//  1. Ask for permission.
//  2. Try to fetch a fresh Expo token from Expo's servers.
//     • If that fails (EXPERIENCE_NOT_FOUND, Expo Go limitation, network …)
//       fall back to the token already stored in the user object that came
//       back from your own login API — it's still valid for delivery.
//  3. If the fresh token differs from what the server already has, PATCH it.
//     If we're using the fallback token the server obviously already has it,
//     so we skip the registration call to avoid a pointless round-trip.
// ─────────────────────────────────────────────────────────────────────────────
export async function registerForPushNotifications(authToken, existingToken = null) {
  try {
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return existingToken;
    }

    console.log('📱 Requesting notification permissions…');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('🔔 Asking user for permission…');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ Push notification permission denied');
      // Still return the existing token — server-side sends still work
      return existingToken;
    }

    console.log('✅ Permission granted — fetching Expo token…');

    // ── Try to get a fresh token ──────────────────────────────────────────
    let freshToken = null;

    try {
      let projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.manifest?.extra?.eas?.projectId ??
        Constants.manifest2?.extra?.eas?.projectId ??
        null;

      if (!projectId || projectId === '') {
        console.warn('⚠️ No EAS projectId configured in app.json');
        console.warn('⚠️ IMPORTANT: If using Expo Go with SDK 53+, push notifications are not supported');
        console.warn('   Use a development build instead: https://docs.expo.dev/develop/development-builds/');
      }

      console.log('🔑 Project ID:', projectId || '(none)');

      const tokenObj = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      freshToken = tokenObj.data;
      console.log('✅ Fresh Expo token obtained:', freshToken?.slice(0, 40) + '…');
    } catch (tokenError) {
      // Common causes:
      //  • Running in Expo Go with SDK 53+ (push removed)
      //  • EXPERIENCE_NOT_FOUND — projectId not registered on Expo servers
      //  • No network
      console.warn('⚠️ Could not fetch fresh Expo token:', tokenError.message);
      console.log('↩️  Falling back to token stored in user profile');
    }

    // ── Decide which token to use ─────────────────────────────────────────
    const tokenToUse = freshToken ?? existingToken;

    if (!tokenToUse) {
      console.log('⚠️ No push token available (fresh or cached)');
      return null;
    }

    // ── Register with backend only when we have a NEW token ──────────────
    // If freshToken is null we fell back to existingToken, which the server
    // already knows about — no need to re-send it.
    const shouldRegister = freshToken !== null && freshToken !== existingToken;

    if (shouldRegister && authToken) {
      try {
        console.log('📤 Registering fresh token with backend…');
        const response = await makeRequest(
          `${apiConfig.BASE_URL}/notifications/register-token`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ expo_push_token: freshToken }),
          }
        );
        console.log('✅ Token registered:', response.message);
      } catch (regError) {
        // Non-fatal — the old token in the DB still works for delivery
        console.warn('⚠️ Backend token registration failed:', regError.message);
      }
    } else if (!shouldRegister) {
      console.log('ℹ️  Token unchanged — skipping backend registration');
    }

    return tokenToUse;
  } catch (error) {
    console.error('❌ registerForPushNotifications error:', error.message);
    return existingToken; // always return something usable
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// setupNotificationListeners
// Returns a cleanup function — call it in a useEffect return.
// ─────────────────────────────────────────────────────────────────────────────
export function setupNotificationListeners(navigation) {
  const subscriptions = [];
  const processedNotifications = new Map(); // Track notifications we've already processed

  try {
    // Foreground notification received
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const notifId = notification.request.identifier;
        const now = Date.now();
        
        // Check if we've seen this notification ID in the last 2 seconds
        const lastSeenTime = processedNotifications.get(notifId);
        if (lastSeenTime && (now - lastSeenTime) < 2000) {
          console.log('⚠️ DUPLICATE notification (ignored):', {
            title: notification.request.content.title,
            body: notification.request.content.body,
            id: notifId,
            timeSinceFirst: now - lastSeenTime + 'ms',
          });
          return; // Don't process duplicates
        }

        // Record this notification as processed
        processedNotifications.set(notifId, now);
        
        // Clean up old entries to prevent memory leak
        for (const [id, time] of processedNotifications.entries()) {
          if (now - time > 5000) {
            processedNotifications.delete(id);
          }
        }
        
        console.log('📬 Foreground notification (unique):', {
          title: notification.request.content.title,
          body:  notification.request.content.body,
          notificationId: notifId,
        });
      }
    );
    subscriptions.push(foregroundSub);

    // User tapped a notification
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response.notification.request.content.title);
        const data = response.notification.request.content.data;

        if (data?.alert_type === 'sos' || data?.type === 'announcement') {
          console.log('📲 Navigating to Notifications screen…');
          navigation?.navigate('Notifications');
        }
      }
    );
    subscriptions.push(responseSub);

    console.log('✅ Notification listeners setup complete (with deduplication)');

    return () => {
      console.log('🧹 Cleaning up notification listeners…');
      subscriptions.forEach((sub) => sub?.remove?.());
    };
  } catch (error) {
    console.error('❌ Error setting up listeners:', error);
    return () => {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// sendTestNotification  (dev / debug only)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTestNotification(expoPushToken) {
  if (!expoPushToken) throw new Error('Expo push token is required');

  const message = {
    to:    expoPushToken,
    sound: 'default',
    title: 'Test Notification',
    body:  'This is a test push notification from AshaSetu!',
    data:  { type: 'test' },
  };

  console.log('🧪 Sending test notification…');
  const res  = await fetch('https://exp.host/--/api/v2/push/send', {
    method:  'POST',
    headers: {
      Accept:           'application/json',
      'Accept-encoding':'gzip, deflate',
      'Content-Type':   'application/json',
    },
    body: JSON.stringify(message),
  });
  const data = await res.json();
  console.log('✅ Test notification response:', data);
  return data;
}