// Mobile/AshaSetu/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [token,           setToken]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount,     setUnreadCount]     = useState(0);

  // ── Restore session from AsyncStorage on app start ──────────────────────────
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        console.log('🔍 AuthContext: Loading saved session...');

        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser  = await AsyncStorage.getItem('userData');

        console.log('🔍 AuthContext: Saved token exists:', !!savedToken);
        console.log('🔍 AuthContext: Saved user exists:', !!savedUser);

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);

          // Ensure is_admin is boolean
          parsedUser.is_admin =
            parsedUser.is_admin === true ||
            parsedUser.is_admin === 'true' ||
            parsedUser.is_admin === 1;

          console.log('🔍 AuthContext: Restored user:', parsedUser);
          console.log('🔍 AuthContext: is_admin:', parsedUser.is_admin);

          setToken(savedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          console.log('🔍 AuthContext: No saved session found');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('❌ AuthContext: Failed to restore session:', e);
        // Clear potentially corrupted data
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        console.log('🔍 AuthContext: Loading complete, user:', !!user);
      }
    };
    bootstrapAsync();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (userToken, userData) => {
    try {
      console.log('🔍 AuthContext: Login called');
      console.log('🔍 AuthContext: Received userData:', userData);

      // Ensure is_admin is boolean
      const processedUser = {
        ...userData,
        is_admin:
          userData.is_admin === true ||
          userData.is_admin === 'true' ||
          userData.is_admin === 1,
      };

      console.log('🔍 AuthContext: Processed user:', processedUser);
      console.log('🔍 AuthContext: is_admin after fix:', processedUser.is_admin);

      // ✅ FIX: Save processedUser (not raw userData) to AsyncStorage
      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('userData', JSON.stringify(processedUser));
      setToken(userToken);
      setUser(processedUser); // ✅ FIX: set processedUser in state too
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      console.log('🔍 AuthContext: Logging out');

      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  // ── Update stored user (e.g. after profile edit or email verification) ──────
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

  const isAdmin = user?.is_admin === true;
  // ── Refresh token + user from backend ────────────────────────────────────────
  // Calls POST /api/auth/refresh-token which reads the CURRENT is_admin
  // value from the database and returns a fresh JWT.
  // Use this after admin rights are granted so the app knows immediately
  // without requiring a logout/login cycle.
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
        if (!data.data || !data.data.token || !data.data.user) {
          console.error('Invalid refresh token response format:', data);
          return false;
        }
        // Persist the new token and updated user object
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

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    unreadCount,
    setUnreadCount,
    login,
    logout,
    updateUser,
    refreshUser,   // ← NEW: exposed so any screen can call it
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};