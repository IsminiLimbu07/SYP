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
  const unsubscribeListenersRef = React.useRef(null);
  const listenerSetupCountRef = React.useRef(0);

  // ── Setup notification listeners once navigation is ready ──────────────────
  useEffect(() => {
    let isMounted = true;
    
    // Delay to ensure navigation is properly initialized
    const timer = setTimeout(() => {
      if (isMounted && navigationRef.current && !unsubscribeListenersRef.current) {
        listenerSetupCountRef.current += 1;
        console.log(`🔔 Setting up notification listeners (attempt ${listenerSetupCountRef.current})...`);
        unsubscribeListenersRef.current = setupNotificationListeners(navigationRef.current.navigation);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      // Cleanup listeners when component unmounts
      if (unsubscribeListenersRef.current) {
        console.log('🧹 Cleaning up notification listeners...');
        unsubscribeListenersRef.current();
        unsubscribeListenersRef.current = null;
      }
    };
  }, []); // Only on mount/unmount

  // ── Register push token when user logs in ────────────────────────────────────
  useEffect(() => {
    const registerToken = async () => {
      if (!loading && user && token) {
        console.log('🔔 Registering push notifications for user:', user.email);

        // Register for push notifications and send token to backend
        const expoPushToken = await registerForPushNotifications(token);

        if (expoPushToken) {
          console.log('✅ Push notifications registered:', expoPushToken);
        } else {
          console.log('⚠️ Push notifications not available on this device');
        }
      }
    };

    registerToken();
  }, [user, token, loading]);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}