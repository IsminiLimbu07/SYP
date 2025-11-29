const YOUR_LAPTOP_IP = '192.168.1.6'; // 👈 CHANGE THIS!

const PORT = 9000;

// Construct the base URL
const API_BASE_URL = `http://192.168.1.6:9000/api`;

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
    console.log('🔄 API Request:', {
      url,
      method: options.method || 'GET',
      timestamp: new Date().toISOString()
    });

    // Create a timeout promise
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
    
    // More helpful error messages
    if (errorMsg.includes('Network request failed')) {
      throw new Error(
        'Cannot reach server. Check:\n' +
        '1. Phone & laptop on same WiFi\n' +
        '2. Backend is running\n' +
        `3. Can access http://${YOUR_LAPTOP_IP}:${PORT}/ in phone browser`
      );
    }
    
    throw new Error(errorMsg);
  }
};

// Connection test function (useful for debugging)
export const testConnection = async () => {
  try {
    const response = await fetch(`http://${YOUR_LAPTOP_IP}:${PORT}/`, {
      method: 'GET',
      timeout: 5000,
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
      instructions: [
        'Make sure backend is running',
        'Check if phone and laptop are on same WiFi',
        `Try accessing http://${YOUR_LAPTOP_IP}:${PORT}/ in phone browser`,
        'Check Windows Firewall settings',
      ],
    };
  }
};