// Mobile/AshaSetu/api/admin.js
import { apiConfig } from '../config/api';

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