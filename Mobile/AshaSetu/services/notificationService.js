// Mobile/AshaSetu/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiConfig, makeRequest } from '../config/api';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications and store token on backend
 * Call this on app startup (in your root App component or after user login)
 */
export async function registerForPushNotifications(authToken) {
  try {
    // Check if device is physical (required for push notifications)
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return null;
    }

    console.log('📱 Device detected, requesting notification permissions...');

    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('📋 Current permission status:', existingStatus);

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('🔔 Requesting permission from user...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('✅ User permission response:', status);
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ Failed to get push notification permissions');
      return null;
    }

    console.log('✅ Permissions granted! Getting Expo token...');

    // Get project ID from app.json or Constants
    let projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // If not in app.json, try to get from Constants.manifest
    if (!projectId) {
      projectId = Constants.manifest?.extra?.eas?.projectId || 
                  Constants.manifest2?.extra?.eas?.projectId;
    }

    console.log('🔑 Project ID:', projectId);

    // If still no projectId, we need to handle this
    if (!projectId) {
      console.warn('⚠️ Warning: No projectId found in manifest');
      console.log('📝 Using fallback: app name as identifier');
      projectId = Constants.expoConfig?.name || 'ashasetu';
    }

    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const tokenStr = expoPushToken.data;
    console.log('✅ Expo Push Token obtained:', tokenStr.substring(0, 50) + '...');

    // Send token to backend to store in database
    if (authToken && tokenStr) {
      try {
        console.log('📤 Sending token to backend...');
        const response = await makeRequest(
          `${apiConfig.BASE_URL}/notifications/register-token`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ expo_push_token: tokenStr }),
          }
        );
        console.log('✅ Token registered with backend:', response.message);
      } catch (error) {
        console.error('⚠️ Failed to register token with backend:', error.message);
        // Don't fail completely if backend registration fails
        // Token is still useful for testing
      }
    }

    return tokenStr;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error.message);
    console.error('📋 Error details:', error);
    return null;
  }
}

/**
 * Set up notification listeners
 * Call this in your root component useEffect
 * Returns cleanup function
 */
export function setupNotificationListeners(navigation) {
  const subscriptions = [];

  try {
    // Listen for notifications when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received (foreground):', {
          title: notification.request.content.title,
          body: notification.request.content.body,
        });
        // Can update UI badge, play sound, etc.
      }
    );
    subscriptions.push(foregroundSubscription);

    // Listen for when user taps on notification
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Notification tapped:', {
          title: response.notification.request.content.title,
        });
        const data = response.notification.request.content.data;

        // Navigate based on notification type
        if (data?.type === 'announcement' || data?.alertType === 'sos') {
          console.log('📲 Navigating to Notifications screen...');
          navigation?.navigate('Notifications');
        }
      });
    subscriptions.push(responseSubscription);

    console.log('✅ Notification listeners setup complete');

    // Return cleanup function
    return () => {
      console.log('🧹 Cleaning up notification listeners...');
      subscriptions.forEach((sub) => {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      });
    };
  } catch (error) {
    console.error('❌ Error setting up listeners:', error);
    return () => {}; // Return empty cleanup function
  }
}

/**
 * Send a test notification (for development/debugging only)
 */
export async function sendTestNotification(expoPushToken) {
  if (!expoPushToken) {
    console.error('❌ No token provided for test notification');
    throw new Error('Expo push token is required');
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Test Notification',
    body: 'This is a test push notification from AshaSetu!',
    data: { type: 'test' },
  };

  try {
    console.log('🧪 Sending test notification...');
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('✅ Test notification response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    throw error;
  }
}