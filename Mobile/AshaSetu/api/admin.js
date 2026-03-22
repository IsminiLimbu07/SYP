// Mobile/AshaSetu/api/admin.js
import { apiConfig, makeRequest } from '../config/api';

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = async (token) => {
  const response = await fetch(`${apiConfig.BASE_URL}/admin/users`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  return data;
};

export const getUserById = async (token, userId) => {
  const response = await fetch(`${apiConfig.BASE_URL}/admin/users/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch user');
  }
  return data;
};

export const deleteUser = async (token, userId) => {
  const response = await fetch(`${apiConfig.BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete user');
  }
  return data;
};

export const toggleUserStatus = async (token, userId) => {
  const response = await fetch(`${apiConfig.BASE_URL}/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update user status');
  }
  return data;
};

export const toggleAdminRole = async (token, userId) => {
  const response = await fetch(`${apiConfig.BASE_URL}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update admin role');
  }
  return data;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const sendNotification = async (token, notificationData) => {
  const response = await fetch(`${apiConfig.BASE_URL}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(notificationData),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to send notification');
  }
  return data;
};

export const deleteNotification = async (token, notificationId) => {
  const response = await fetch(`${apiConfig.BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete notification');
  }
  return data;
};

// ─── Volunteer Management ─────────────────────────────────────────────────────

export const getPendingVolunteerApplications = async (token) => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.VOLUNTEERS_PENDING, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getAllVolunteers = async (token) => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.VOLUNTEERS_ALL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const approveVolunteer = async (token, userId, adminNotes = '') => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.VOLUNTEER_APPROVE(userId), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ admin_notes: adminNotes }),
  });
};

export const rejectVolunteer = async (token, userId, rejectionReason, adminNotes = '') => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.VOLUNTEER_REJECT(userId), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rejection_reason: rejectionReason, admin_notes: adminNotes }),
  });
};

export const revokeVolunteerStatus = async (token, userId, reason = '') => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.VOLUNTEER_REVOKE(userId), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
};

// ─── Campaign Management ──────────────────────────────────────────────────────

// Get pending campaigns awaiting admin review
export const getPendingCampaigns = async (token) => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.CAMPAIGNS_PENDING, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Get all campaigns (all statuses) for admin overview
export const getAllCampaignsAdmin = async (token) => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.CAMPAIGNS_ALL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Approve a campaign — makes it live
export const approveCampaign = async (token, campaignId, adminNotes = '') => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.CAMPAIGN_APPROVE(campaignId), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ admin_notes: adminNotes }),
  });
};

// Reject a campaign — requires a reason
export const rejectCampaign = async (token, campaignId, rejectionReason, adminNotes = '') => {
  return makeRequest(apiConfig.ENDPOINTS.ADMIN.CAMPAIGN_REJECT(campaignId), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rejection_reason: rejectionReason, admin_notes: adminNotes }),
  });
};