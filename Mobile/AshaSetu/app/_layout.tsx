import React, { useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';
import { registerForPushNotifications, setupNotificationListeners } from '../services/notificationService';
import { NavigationContainer } from '@react-navigation/native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppWithNotifications />
    </AuthProvider>
  );
}

function AppWithNotifications() {
  const { user, token, loading } = useContext(AuthContext);
  const navigationRef = React.useRef(null);

  useEffect(() => {
    // Initialize push notifications when user logs in
    const initNotifications = async () => {
      if (!loading && user && token) {
        console.log('🔔 Initializing push notifications for user:', user.email);

        // Register for push notifications and send token to backend
        const expoPushToken = await registerForPushNotifications(token);

        if (expoPushToken) {
          console.log('✅ Push notifications initialized:', expoPushToken);
        } else {
          console.log('⚠️ Push notifications not available on this device');
        }
      }
    };

    initNotifications();

    // Setup notification listeners (handles incoming notifications)
    const unsubscribeListeners = setupNotificationListeners(navigationRef.current?.navigation);

    return () => {
      if (unsubscribeListeners) {
        unsubscribeListeners();
      }
    };
  }, [user, token, loading]);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}