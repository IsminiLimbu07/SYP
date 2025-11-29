// Platform-specific API configuration
// Choose the correct configuration based on your development environment

export const getApiBaseUrl = () => {
  // Uncomment the appropriate configuration for your platform

  // 🖥️ Web/Desktop Testing
  // return 'http://localhost:9000/api';

  // 📱 iOS Simulator (use localhost directly)
  // return 'http://localhost:9000/api';

  // 🤖 Android Emulator (use 10.0.2.2 to reach host machine)
  // return 'http://10.0.2.2:9000/api';

  // 📞 Physical Device (replace with your machine's IP)
  // Get your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
  // return 'http://192.168.1.YOUR_IP:9000/api';

  // Default: localhost
  return 'http://localhost:9000/api';
};

export const apiConfig = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      REGISTER: `${getApiBaseUrl()}/auth/register`,
      LOGIN: `${getApiBaseUrl()}/auth/login`,
      PROFILE: `${getApiBaseUrl()}/auth/profile`,
      UPDATE_PROFILE: `${getApiBaseUrl()}/auth/profile`,
      CHANGE_PASSWORD: `${getApiBaseUrl()}/auth/change-password`,
    },
  },
};

// Helper function to make API requests
export const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Network error occurred');
  }
};
