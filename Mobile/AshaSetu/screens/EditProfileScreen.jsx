// frontend/src/screens/EditProfileScreen.jsx
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config/api';
import {
  saveProfilePicture,
  getProfilePicture,
  uploadProfilePictureToServer,
} from '../api/profileImageStorage';

const EditProfileScreen = ({ navigation }) => {
  const { user, login, logout } = useContext(AuthContext);

  const [editingName, setEditingName]       = useState(false);
  const [newName, setNewName]               = useState(user?.full_name || '');
  const [savingName, setSavingName]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localPicUri, setLocalPicUri]       = useState(null);

  // Load locally-saved picture on mount and when screen is focused
  useEffect(() => {
    loadLocalPicture();
    const unsubscribe = navigation.addListener('focus', loadLocalPicture);
    return unsubscribe;
  }, [navigation]);

  const loadLocalPicture = async () => {
    const saved = await getProfilePicture();
    if (saved) setLocalPicUri(saved);
  };

  // Resolved avatar: prefer local → then server URL
  const profilePicture = localPicUri || user?.profile?.profile_picture_url || null;

  // ── Change Picture ─────────────────────────────────────────────────────────
  const handleChangePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant photo library access to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadingPhoto(true);
        const asset = result.assets[0];

        try {
          // 1. Save locally first for instant display
          await saveProfilePicture(asset.uri);
          setLocalPicUri(asset.uri);

          // 2. Upload to server so other users can see it
          await uploadProfilePictureToServer(asset.uri);

          // 3. Re-fetch profile and refresh auth context so it's current everywhere
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            const profileRes = await fetch(`${apiConfig.BASE_URL}/api/auth/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const profileJson = await profileRes.json();
            if (profileJson.success) {
              await login(token, profileJson.data);
            }
          }

          Alert.alert('Success', 'Profile picture updated!');
        } catch (uploadErr) {
          console.error('Upload Error:', uploadErr);
          Alert.alert('Upload Failed', uploadErr.message || 'Could not upload photo. Please try again.');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to pick image. Please try again.');
      setUploadingPhoto(false);
    }
  };

  // ── Save name ──────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Invalid', 'Name cannot be empty.');
      return;
    }
    if (newName.trim() === user?.full_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${apiConfig.BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: newName.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      await login(token, json.data);
      setEditingName(false);
      Alert.alert('Success', 'Name updated!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Tappable avatar */}
          <TouchableOpacity onPress={handleChangePicture} style={styles.avatarWrap} activeOpacity={0.8}>
            {uploadingPhoto ? (
              <View style={[styles.avatar, styles.avatarLoading]}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            ) : profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          {/* Editable name */}
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                maxLength={60}
              />
              {savingName ? (
                <ActivityIndicator color="#8B0000" style={{ marginLeft: 8 }} />
              ) : (
                <>
                  <TouchableOpacity onPress={handleSaveName} style={styles.nameActionBtn}>
                    <Text style={styles.nameSave}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setEditingName(false); setNewName(user?.full_name || ''); }}
                    style={styles.nameActionBtn}
                  >
                    <Text style={styles.nameCancel}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)} style={styles.nameRow} activeOpacity={0.7}>
              <Text style={styles.name}>{user?.full_name}</Text>
              <Text style={styles.editPencil}>✏️</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.email}>{user?.email}</Text>

          {/* Blood group + city chips */}
          <View style={styles.chipsRow}>
            {user?.profile?.blood_group ? (
              <View style={styles.chipRed}>
                <Text style={styles.chipRedText}>🩸 {user.profile.blood_group}</Text>
              </View>
            ) : null}
            {user?.profile?.city ? (
              <View style={styles.chipGray}>
                <Text style={styles.chipGrayText}>📍 {user.profile.city}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Account info ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <Row label="Phone Number" value={user?.phone_number} />
            <Divider />
            <Row
              label="Account Status"
              value={user?.is_verified ? '✅ Verified' : '⚠️ Not Verified'}
              valueStyle={user?.is_verified ? styles.verified : styles.unverified}
            />
            <Divider />
            <Row
              label="Member Since"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              }) : 'N/A'}
            />
          </View>
        </View>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChangePassword')}
            activeOpacity={0.75}
          >
            <View style={styles.actionLeft}>
              <Text style={styles.actionIcon}>🔒</Text>
              <Text style={styles.actionButtonText}>Change Password</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Logout ───────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.85}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Small helpers ──────────────────────────────────────────────────────────────
const Row = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value || 'Not set'}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

// ── Styles — identical to your original file 2 ────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: '#8B0000',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarLoading: { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 14, width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  cameraIcon: { fontSize: 14 },

  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginRight: 6 },
  editPencil: { fontSize: 16 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameInput: {
    fontSize: 20, fontWeight: '700', color: '#fff',
    borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 2, paddingHorizontal: 4, minWidth: 140, textAlign: 'center',
  },
  nameActionBtn: { marginLeft: 8, padding: 4 },
  nameSave: { fontSize: 20, color: '#90ee90', fontWeight: '800' },
  nameCancel: { fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: '800' },

  email: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chipRed: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  chipRedText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chipGray: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  chipGrayText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  section: { marginTop: 22, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#999',
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10,
  },

  card: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  infoLabel: { fontSize: 15, color: '#666' },
  infoValue: { fontSize: 15, color: '#333', fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  verified: { color: '#4caf50', fontWeight: '700' },
  unverified: { color: '#f57c00', fontWeight: '700' },

  actionButton: {
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderRadius: 14,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  chevron: { fontSize: 22, color: '#8B0000', fontWeight: '600' },

  logoutButton: {
    backgroundColor: '#8B0000', marginHorizontal: 20, marginTop: 28,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: '#8B0000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  logoutButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});

export default EditProfileScreen;