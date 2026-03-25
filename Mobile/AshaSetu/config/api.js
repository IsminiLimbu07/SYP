// ─── IMPORTANT: Update this URL every time you restart ngrok ─────────────────
// Run: ngrok http 9000
// Then copy the https URL it gives you and paste it below
const NGROK_URL = 'https://tularaemic-electroneutral-ozella.ngrok-free.dev';
//const NGROK_URL ='https://malachi-inconvertible-lita.ngrok-free.dev';

// ─── Derived URLs ─────────────────────────────────────────────────────────────
const API_BASE_URL    = `${NGROK_URL}/api`;
const SERVER_BASE_URL = NGROK_URL;

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
       UPLOAD_PROFILE_PICTURE: `${NGROK_URL}/api/auth/upload-profile-picture`,
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

      // Campaigns  ← NEW
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

// config/api.js
export const makeRequest = async (endpoint, options = {}) => {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${apiConfig.BASE_URL}${endpoint}`;
    
    // Log the request
    console.log('🔗 API Request:', {
      url,
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.parse(options.body) : null
    });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    console.log('✅ API Response:', {
      url,
      status: response.status,
      success: data.success,
      data: data.data
    });
    
    return data;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    throw error;
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