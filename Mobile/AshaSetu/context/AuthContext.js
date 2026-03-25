import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiConfig } from '../config/api';

export const AuthContext = createContext();

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// Register device and save push token to backend
const registerPushToken = async (authToken) => {
  try {
    if (!Device.isDevice) return; // won't work on emulator
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const pushToken = (await Notifications.getExpoPushTokenAsync({
      projectId: 'fbdd1117-e4ef-4d7b-a255-dbcb8d9a9285',
    })).data;

    await fetch(`${apiConfig.BASE_URL}/users/push-token`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify({ push_token: pushToken }),
    });

    console.log('✅ Push token registered:', pushToken);
  } catch (e) {
    console.error('Push token registration failed:', e);
  }
};

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [token,           setToken]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount,     setUnreadCount]     = useState(0);

  const fetchUnreadCount = useCallback(async (authToken) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await response.json();
      if (data.success) setUnreadCount(data.count);
    } catch (e) {
      console.error('Error fetching unread count:', e);
    }
  }, [token]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser  = await AsyncStorage.getItem('userData');

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          parsedUser.is_admin =
            parsedUser.is_admin === true ||
            parsedUser.is_admin === 'true' ||
            parsedUser.is_admin === 1;

          setToken(savedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          await fetchUnreadCount(savedToken);
          await registerPushToken(savedToken); // ← re-register on app start
        }
      } catch (e) {
        console.error('Failed to restore token:', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrapAsync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (userToken, userData) => {
    try {
      const processedUser = {
        ...userData,
        is_admin:
          userData.is_admin === true ||
          userData.is_admin === 'true' ||
          userData.is_admin === 1,
      };

      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('userData', JSON.stringify(processedUser));
      setToken(userToken);
      setUser(processedUser);
      setIsAuthenticated(true);
      await fetchUnreadCount(userToken);
      await registerPushToken(userToken); // ← register on login

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('userToken');
      if (!savedToken) return false;

      const response = await fetch(`${apiConfig.BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await AsyncStorage.setItem('userToken', data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh user error:', error);
      return false;
    }
  };

  const isAdmin = user?.is_admin === true;

  const value = {
    user, token, loading, isAuthenticated, isAdmin,
    login, logout, updateUser, refreshUser,
    unreadCount, setUnreadCount, fetchUnreadCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};