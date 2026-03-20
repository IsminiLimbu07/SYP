// Previously used ngrok tunnel URL (kept here for reference):
const NGROK_URL = 'https://valery-bridgeless-undesignedly.ngrok-free.dev';

// Local IP configuration (commented out while using ngrok)
// const API_BASE_URL = 'http://192.168.1.4:9000/api';
// const SERVER_BASE_URL = 'http://192.168.1.4:9000';

// Use ngrok for tunneling during development
const API_BASE_URL = `${NGROK_URL}/api`;
const SERVER_BASE_URL = NGROK_URL;

// API Configurationr
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

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.warn('⚠️ Failed to parse JSON response, fallback to text:', text);
      data = { success: false, message: text || parseError.message };
    }

    console.log('✅ API Response Data:', data);

    if (!response.ok) {
      const errorMsg = (data && data.message) || `HTTP error! status: ${response.status}`;
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
        '2. Ngrok is running and the tunnel URL is correct\n' +
        '3. Your mobile device/emulator can access the ngrok URL'
      );
    }
    
    throw new Error(errorMsg);
  }
};

// Connection test function
export const testConnection = async () => {
  try {
const response = await fetch(`${SERVER_BASE_URL}/`, {
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
