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

  // ── Restore session from AsyncStorage on app start ──────────────────────────
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser  = await AsyncStorage.getItem('userData');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to restore token:', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (userToken, userData) => {
    try {
      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
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
    login,
    logout,
    updateUser,
    refreshUser,   // ← NEW: exposed so any screen can call it
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};