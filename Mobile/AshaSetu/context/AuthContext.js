import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        console.log('🔍 AuthContext: Loading saved session...');

        const savedToken = await AsyncStorage.getItem('userToken');
        const savedUser = await AsyncStorage.getItem('userData');

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
        }
      } catch (e) {
        console.error('Failed to restore token:', e);
      } finally {
        setLoading(false);
        console.log('🔍 AuthContext: Loading complete');
      }
    };

    bootstrapAsync();
  }, []);

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

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};