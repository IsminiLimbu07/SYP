// ✅ USE NGROK URL
const NGROK_URL = 'https://tularaemic-electroneutral-ozella.ngrok-free.dev'; // 👈 PASTE YOUR NGROK URL

const API_BASE_URL = `${NGROK_URL}/api`;

// API Configuration
export const apiConfig = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      REGISTER: `${API_BASE_URL}/auth/register`,
      LOGIN: `${API_BASE_URL}/auth/login`,
      PROFILE: `${API_BASE_URL}/auth/profile`,
      UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
      CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    },
  },
};

// Helper function to make API requests
export const makeRequest = async (url, options = {}) => {
  try {
    console.log('📄 API Request:', {
      url,
      method: options.method || 'GET',
      timestamp: new Date().toISOString()
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    console.log('📊 API Response Status:', response.status);

    const data = await response.json();

    console.log('✅ API Response Data:', data);

    if (!response.ok) {
      const errorMsg = data.message || `HTTP error! status: ${response.status}`;
      console.error('❌ API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    const errorMsg = error.message || 'Network error occurred';
    console.error('🚨 Request failed:', errorMsg);
    console.error('Full error:', error);
    
    if (errorMsg.includes('Network request failed')) {
      throw new Error(
        'Cannot reach server. Make sure:\n' +
        '1. Backend is running\n' +
        '2. Ngrok is running\n' +
        '3. Ngrok URL is correct in api.js'
      );
    }
    
    throw new Error(errorMsg);
  }
};

// Connection test function
export const testConnection = async () => {
  try {
    const response = await fetch(`${NGROK_URL}/`, {
      method: 'GET',
    });
    
    const data = await response.json();
    
    return {
      success: true,
      message: 'Connected successfully!',
      serverMessage: data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Connection failed',
      error: error.message,
    };
  }
};