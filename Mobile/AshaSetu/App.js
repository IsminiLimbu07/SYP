import React, { useRef } from 'react';  // ✅ fixed typo
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import AppNavigator, { linking } from './navigation/AppNavigator';
import { createNavigationContainerRef } from '@react-navigation/native';

// ✅ useRef must NOT be called at top level — use createNavigationContainerRef instead
export const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        fallback={<ActivityIndicator color="#8B0000" />}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}