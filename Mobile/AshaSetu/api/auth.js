// Auth API functions
import { apiConfig, makeRequest } from '../config/api';

export const loginUser = async (credentials) => {
  try {
    console.log('🔍 API: Making login request with:', credentials.email);

    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    console.log('🔍 API: Raw response:', JSON.stringify(response, null, 2));

    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }

    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response format from server');
    }

    const { token, user } = response.data;
    const processedUser = {
      ...user,
      is_admin: user.is_admin === true || user.is_admin === 'true' || user.is_admin === 1,
    };

    console.log('🔍 API: Processed user:', processedUser);
    console.log('🔍 API: is_admin after fix:', processedUser.is_admin);

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

    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response format from server');
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
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch profile');
    }

    if (!response.data) {
      throw new Error('Invalid response format from server');
    }

    return {
      success: response.success,
      message: response.message,
      user: response.data,
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
        'Content-Type': 'application/json',  // ✅ ADDED
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    if (!response.data) {
      throw new Error('Invalid response format from server');
    }

    return {
      success: response.success,
      message: response.message,
      user: response.data,
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
        'Content-Type': 'application/json',  // ✅ THIS WAS THE BUG
        'Authorization': `Bearer ${token}`,
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

export const sendVerificationEmail = async (token) => {
  try {
    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.SEND_VERIFICATION_EMAIL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',  // ✅ ADDED
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to send verification email');
    }

    return {
      success: response.success,
      message: response.message,
    };
  } catch (error) {
    throw error;
  }
};