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
    console.log('📤 REGISTER API: Sending registration data:', {
      full_name: userData.full_name,
      email: userData.email,
      phone_number: userData.phone_number,
      city: userData.city,
      blood_type: userData.blood_type,
      password_length: userData.password?.length
    });

    const response = await makeRequest(apiConfig.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // ✅ ADD THIS
      },
      body: JSON.stringify(userData),
    });

    console.log('📥 REGISTER API: Response received:', response);

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
    console.error('❌ REGISTER API Error:', error);
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