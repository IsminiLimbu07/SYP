// Auth API functions
import { apiConfig, makeRequest } from '../config/api';

export const loginUser = async (credentials) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }

    return {
      success: response.success,
      message: response.message,
      token: response.data.token,
      user: response.data.user,
    };
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Registration failed');
    }

    return {
      success: response.success,
      message: response.message,
      token: response.data.token,
      user: response.data.user,
    };
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (token) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch profile');
    }

    return {
      success: response.success,
      message: response.message,
      user: response.data.user,
    };
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (token, profileData) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.UPDATE_PROFILE, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    return {
      success: response.success,
      message: response.message,
      user: response.data.user,
    };
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (token, passwordData) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }

    return {
      success: response.success,
      message: response.message,
    };
  } catch (error) {
    throw error;
  }
};
