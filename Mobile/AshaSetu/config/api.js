// API Configuration with fallback support
// This allows the app to work from different networks and locations

const API_URLS = {
  // Primary: Your home/office network
  primary: 'http://192.168.56.1:9000/api',
  
  // Fallback options (for different networks)
  fallbacks: [
    'http://192.168.1.1:9000/api',      // Common home router
    'http://10.0.0.1:9000/api',         // Some networks
    'http://192.168.0.1:9000/api',      // Other networks
    'http://localhost:9000/api',        // Local machine (web only)
  ],
  
  // Production (when deployed to real server)
  production: 'https://api.ashasetu.com/api', // Replace with your actual server
};

// Try to detect which network is available
let API_BASE_URL = API_URLS.primary;

// For production builds, use the production URL
// For development, use primary IP (your machine)
if (process.env.NODE_ENV === 'production') {
  API_BASE_URL = API_URLS.production;
}

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

// Helper function to make API requests with retry logic
export const makeRequest = async (url, options = {}) => {
  try {
    console.log('🔄 API Request:', {
      url,
      method: options.method || 'GET',
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 10000, // 10 second timeout
      ...options,
    });

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
    throw new Error(errorMsg);
  }
};
