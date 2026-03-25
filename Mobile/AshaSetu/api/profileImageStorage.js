// frontend/src/api/profileImageStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { apiConfig } from '../config/api';

const PROFILE_PIC_KEY = 'localProfilePicUri';

// ── Upload to server ──────────────────────────────────────────────────────────
const uploadProfilePictureToServer = async (uri) => {
  try {
    if (!uri) throw new Error('No image URI provided');

    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('Please log in again.');

    const match = uri.match(/\.(\w+)(?:\?.*)?$/);
    const fileType =
      match && match[1] && match[1].length <= 5
        ? match[1].toLowerCase()
        : 'jpg';

    const formData = new FormData();
    formData.append('profile_picture', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: `photo.${fileType}`,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    });

    const uploadUrl = `${apiConfig.BASE_URL}/auth/upload-profile-picture`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const responseText = await response.text();

    if (!responseText.trim().startsWith('{')) {
      throw new Error(
        `Server returned non-JSON: ${responseText.substring(0, 50)}`
      );
    }

    const json = JSON.parse(responseText);
    if (!json.success) throw new Error(json.message || 'Upload failed');

    return json.data.profile_picture_url;
  } catch (error) {
    console.error('❌ Upload Error:', error.message);
    throw error;
  }
};

// ── Save a permanent local copy of the picture ────────────────────────────────
// The image picker returns a temporary cache URI that the OS can delete at any
// time. This copies the file into the app's permanent documents directory so it
// survives app restarts, then stores that stable path in AsyncStorage.
const saveProfilePicture = async (tempUri) => {
  try {
    if (!tempUri) return;

    const fileName = `profile_pic_${Date.now()}.jpg`;
    const permanentUri = `${FileSystem.documentDirectory}${fileName}`;

    // Delete any previously saved copy to avoid filling up storage
    const existing = await AsyncStorage.getItem(PROFILE_PIC_KEY);
    if (existing) {
      await FileSystem.deleteAsync(existing, { idempotent: true });
    }

    // Copy temp → permanent location
    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

    // Persist the stable URI
    await AsyncStorage.setItem(PROFILE_PIC_KEY, permanentUri);

    return permanentUri;
  } catch (error) {
    console.error('❌ saveProfilePicture Error:', error.message);
    throw error;
  }
};

// ── Read the locally saved URI ────────────────────────────────────────────────
const getProfilePicture = async () => {
  try {
    const uri = await AsyncStorage.getItem(PROFILE_PIC_KEY);
    if (!uri) return null;

    // Make sure the file still exists (handles app reinstall / storage clear)
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      await AsyncStorage.removeItem(PROFILE_PIC_KEY);
      return null;
    }

    return uri;
  } catch (error) {
    console.error('❌ getProfilePicture Error:', error.message);
    return null;
  }
};

// ── Clear local picture (call on logout) ──────────────────────────────────────
const clearProfilePicture = async () => {
  try {
    const uri = await AsyncStorage.getItem(PROFILE_PIC_KEY);
    if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
    await AsyncStorage.removeItem(PROFILE_PIC_KEY);
  } catch (error) {
    console.error('❌ clearProfilePicture Error:', error.message);
  }
};

export {
  uploadProfilePictureToServer,
  saveProfilePicture,
  getProfilePicture,
  clearProfilePicture,
};