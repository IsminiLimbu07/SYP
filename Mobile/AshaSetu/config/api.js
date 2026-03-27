// ✅ PRODUCTION: Using Render deployment URL
const API_BASE_URL = 'https://syp-cuwh.onrender.com/api';
const SERVER_BASE_URL = 'https://syp-cuwh.onrender.com';

// Local development URL (commented out - use Render for production)
// const NGROK_URL = 'https://tularaemic-electroneutral-ozella.ngrok-free.dev';
// const API_BASE_URL = `${NGROK_URL}/api`;
// const SERVER_BASE_URL = NGROK_URL;

// ─── API Configuration ────────────────────────────────────────────────────────
export const apiConfig = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: SERVER_BASE_URL,

  ENDPOINTS: {
    AUTH: {
      REGISTER:                `${API_BASE_URL}/auth/register`,
      LOGIN:                   `${API_BASE_URL}/auth/login`,
      PROFILE:                 `${API_BASE_URL}/auth/profile`,
      UPDATE_PROFILE:          `${API_BASE_URL}/auth/profile`,
      CHANGE_PASSWORD:         `${API_BASE_URL}/auth/change-password`,
      SEND_VERIFICATION_EMAIL: `${API_BASE_URL}/auth/send-verification-email`,
      REFRESH_TOKEN:           `${API_BASE_URL}/auth/refresh-token`,
      UPLOAD_PROFILE_PICTURE:  `${API_BASE_URL}/auth/upload-profile-picture`,
    },

    BLOOD: {
      REQUESTS:     `${API_BASE_URL}/blood/requests`,
      REQUEST:      (id) => `${API_BASE_URL}/blood/request/${id}`,
      CREATE:       `${API_BASE_URL}/blood/request`,
      RESPOND:      `${API_BASE_URL}/blood/respond`,
      MY_RESPONSES: `${API_BASE_URL}/blood/my-responses`,
    },

    DONORS: {
      GET_ALL: `${API_BASE_URL}/donors`,
    },

    COMMUNITY: {
      EVENTS:           `${API_BASE_URL}/community/events`,
      EVENT:            (id) => `${API_BASE_URL}/community/events/${id}`,
      REGISTER:         (id) => `${API_BASE_URL}/community/events/${id}/register`,
      BECOME_VOLUNTEER: `${API_BASE_URL}/community/become-volunteer`,
      MY_STATUS:        `${API_BASE_URL}/community/my-status`,
      UPDATE_EVENT:     (id) => `${API_BASE_URL}/community/events/${id}`,
      DELETE_EVENT:     (id) => `${API_BASE_URL}/community/events/${id}`,
    },

    CHAT: {
      MESSAGES: `${API_BASE_URL}/chat/messages`,
      SEND:     `${API_BASE_URL}/chat/send`,
    },

    VOLUNTEER: {
      APPLY:     `${API_BASE_URL}/volunteer/apply`,
      MY_STATUS: `${API_BASE_URL}/volunteer/my-status`,
      CANCEL:    `${API_BASE_URL}/volunteer/cancel-application`,
    },

    CAMPAIGNS: {
      ALL:         `${API_BASE_URL}/campaigns`,
      DONATE:      `${API_BASE_URL}/campaigns/donate`,
      MINE:        `${API_BASE_URL}/campaigns/my-campaigns`,
      DETAIL:      (id) => `${API_BASE_URL}/campaigns/${id}`,
    },

    NOTIFICATIONS: {
      ALL: `${API_BASE_URL}/notifications`,
      ONE: (id) => `${API_BASE_URL}/notifications/${id}`,
    },

    ADMIN: {
      // Users
      USERS:       `${API_BASE_URL}/admin/users`,
      USER:        (id) => `${API_BASE_URL}/admin/users/${id}`,
      USER_STATUS: (id) => `${API_BASE_URL}/admin/users/${id}/status`,
      USER_ROLE:   (id) => `${API_BASE_URL}/admin/users/${id}/role`,

      // Volunteers
      VOLUNTEERS_PENDING: `${API_BASE_URL}/admin/volunteers/pending`,
      VOLUNTEERS_ALL:     `${API_BASE_URL}/admin/volunteers/all`,
      VOLUNTEER_APPROVE:  (userId) => `${API_BASE_URL}/admin/volunteers/${userId}/approve`,
      VOLUNTEER_REJECT:   (userId) => `${API_BASE_URL}/admin/volunteers/${userId}/reject`,
      VOLUNTEER_REVOKE:   (userId) => `${API_BASE_URL}/admin/volunteers/${userId}/revoke`,

      // Campaigns
      CAMPAIGNS_PENDING: `${API_BASE_URL}/campaigns/admin/pending`,
      CAMPAIGNS_ALL:     `${API_BASE_URL}/campaigns/admin/all`,
      CAMPAIGN_APPROVE:  (id) => `${API_BASE_URL}/campaigns/admin/${id}/approve`,
      CAMPAIGN_REJECT:   (id) => `${API_BASE_URL}/campaigns/admin/${id}/reject`,
    },

    UPLOAD: {
      EVENT_IMAGE: `${API_BASE_URL}/upload/event-image`,
    },
  },
};

export const makeRequest = async (url, options = {}) => {
  try {
    if (!url) {
      throw new Error('API URL is undefined. Check that the endpoint is defined in apiConfig.ENDPOINTS');
    }

    console.log('📄 API Request:', { url, method: options.method || 'GET', timestamp: new Date().toISOString() });

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000);

    const { headers: customHeaders, ...restOptions } = options;

    const response = await fetch(url, {
      ...restOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    });

    clearTimeout(timeoutId);

    console.log('📊 API Response Status:', response.status);

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.warn('⚠️ Failed to parse JSON, got text:', text.slice(0, 200));
      data = { success: false, message: text || parseError.message };
    }

    console.log('✅ API Response Data:', data);

    if (!response.ok) {
      throw new Error((data && data.message) || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    const errorMsg = error.message || 'Network error occurred';
    console.error('🚨 Request failed:', errorMsg);

    if (errorMsg.includes('Network request failed') || errorMsg.includes('aborted')) {
      throw new Error(
        'Cannot reach server. Make sure:\n' +
        '1. Backend is running (node server.js)\n' +
        '2. Ngrok is running and the URL in config/api.js is current\n' +
        '3. Your device and PC are on the same network or ngrok tunnel is active'
      );
    }

    throw new Error(errorMsg);
  }
};

export const testConnection = async () => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/`, { method: 'GET' });
    const data = await response.json();
    return { success: true, message: 'Connected!', serverMessage: data.message };
  } catch (error) {
    return { success: false, message: 'Connection failed', error: error.message };
  }
};