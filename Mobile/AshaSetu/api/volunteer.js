
import { apiConfig, makeRequest } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Apply to become volunteer
export const applyAsVolunteer = async (skills, reason) => {
  const token = await AsyncStorage.getItem('userToken');
  return makeRequest(apiConfig.ENDPOINTS.VOLUNTEER.APPLY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ skills, reason }),
  });
};

// Get my volunteer status
export const getMyVolunteerStatus = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return makeRequest(apiConfig.ENDPOINTS.VOLUNTEER.MY_STATUS, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Cancel volunteer application
export const cancelVolunteerApplication = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return makeRequest(apiConfig.ENDPOINTS.VOLUNTEER.CANCEL, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};
