// frontend/screens/ProfileScreen.jsx
import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { sendVerificationEmail } from '../api/auth';
import { getProfilePicture } from '../api/profileImageStorage';

const NGROK_URL = 'https://tularaemic-electroneutral-ozella.ngrok-free.dev';

const ProfileScreen = ({ navigation, route }) => {
  const { user, token, logout, updateUser } = useContext(AuthContext);
  const profile = route.params?.donor || user;
  const isOwnProfile = !route.params?.donor;

  const [sendingVerification, setSendingVerification] = useState(false);
  const [localProfilePic, setLocalProfilePic]         = useState(null);
  const [cacheKey, setCacheKey]                       = useState(Date.now());

  // ── Re-load picture EVERY time this screen comes into focus ───────────────
  // useFocusEffect runs on mount AND whenever you navigate back here,
  // so returning from EditProfileScreen always shows the freshest picture.
  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        const uri = await getProfilePicture(); // latest locally-saved URI
        setLocalProfilePic(uri || null);
        setCacheKey(Date.now());              // bust any Image component cache
      };
      refresh();
    }, [])
  );

  // ── Resolved avatar ────────────────────────────────────────────────────────
  // Priority: local AsyncStorage URI → server URL (cache-busted)
  // Local always wins because EditProfileScreen saves locally first,
  // so the picture is visible instantly without waiting for a server round-trip.
  const getAvatarUri = () => {
    if (localProfilePic) return localProfilePic; // freshest, from AsyncStorage

    const serverUrl = isOwnProfile
      ? (user?.profile?.profile_picture_url || user?.profile_picture_url)
      : (profile?.profile_picture_url || null);

    if (serverUrl && typeof serverUrl === 'string' && serverUrl.startsWith('http')) {
      return `${serverUrl}?t=${cacheKey}`;
    }
    return null;
  };

  const profilePicture = getAvatarUri();

  // ── Verify email ───────────────────────────────────────────────────────────
  const handleVerifyNow = async () => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail(token);
      Alert.alert(
        'Email Sent ✉️',
        `A verification link has been sent to ${profile?.email}. Check your inbox, click the link, then tap "Already verified? Refresh".`,
      );
    } catch (error) {
      Alert.alert('Failed', error.message || 'Could not send verification email.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleRefreshVerification = async () => {
    try {
      const response = await fetch(`${NGROK_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data.is_verified) {
        await updateUser({ ...user, is_verified: true });
        Alert.alert('Verified! ✅', 'Your email has been verified successfully!');
      } else {
        Alert.alert('Not yet', 'Email not verified yet. Please click the link in your inbox first.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not refresh. Please try again.');
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.avatar}
                // key forces React Native to unmount/remount the Image
                // whenever the URI or cacheKey changes, bypassing its
                // internal cache and actually showing the new picture.
                key={`${profilePicture}-${cacheKey}`}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* ── Verification Banner ── */}
        {isOwnProfile && !profile?.is_verified && (
          <View style={styles.verificationBanner}>
            <View style={styles.bannerTop}>
              <Text style={styles.bannerIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Email Not Verified</Text>
                <Text style={styles.bannerSubtitle}>Verify your email to unlock all features</Text>
              </View>
              <TouchableOpacity
                style={[styles.verifyNowButton, sendingVerification && { backgroundColor: '#ccc' }]}
                onPress={handleVerifyNow}
                disabled={sendingVerification}
              >
                {sendingVerification
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.verifyNowText}>Verify Now</Text>
                }
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshVerification}>
              <Text style={styles.refreshText}>Already verified? Tap to refresh ↻</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Account Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profile?.phone_number}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, profile?.is_verified ? styles.verifiedBadge : styles.unverifiedBadge]}>
                  <Text style={[styles.statusText, profile?.is_verified ? styles.verifiedText : styles.unverifiedText]}>
                    {profile?.is_verified ? '✓ Verified' : '✗ Not Verified'}
                  </Text>
                </View>
                {isOwnProfile && !profile?.is_verified && (
                  <TouchableOpacity onPress={handleVerifyNow} style={styles.inlineVerifyLink} disabled={sendingVerification}>
                    <Text style={styles.inlineVerifyText}>
                      {sendingVerification ? 'Sending...' : 'Verify →'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        {isOwnProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
              <Text style={styles.actionButtonIcon}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={styles.actionButtonText}>Change Password</Text>
              <Text style={styles.actionButtonIcon}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('MyDonationResponses')}>
              <Text style={styles.actionButtonText}>My Donation History</Text>
              <Text style={styles.actionButtonIcon}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.actionButtonText}>Back to Home</Text>
              <Text style={styles.actionButtonIcon}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Logout ── */}
        {isOwnProfile && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1 },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: { marginBottom: 15, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#8B0000' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#8B0000', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  email: { fontSize: 16, color: '#666' },
  verificationBanner: {
    backgroundColor: '#fff8e1', marginHorizontal: 20, marginTop: 16,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ffe082',
  },
  bannerTop: { flexDirection: 'row', alignItems: 'center' },
  bannerIcon: { fontSize: 20, marginRight: 10 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#5d4037' },
  bannerSubtitle: { fontSize: 12, color: '#795548', marginTop: 2 },
  verifyNowButton: { backgroundColor: '#8B0000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginLeft: 10, minWidth: 90, alignItems: 'center' },
  verifyNowText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  refreshButton: { marginTop: 10, alignItems: 'center', paddingVertical: 6 },
  refreshText: { color: '#8B0000', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
  infoCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 16, color: '#666' },
  infoValue: { fontSize: 16, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e0e0e0' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  verifiedBadge: { backgroundColor: '#e8f5e9' },
  unverifiedBadge: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 14, fontWeight: '600' },
  verifiedText: { color: '#4caf50' },
  unverifiedText: { color: '#f44336' },
  inlineVerifyLink: { paddingHorizontal: 8, paddingVertical: 4 },
  inlineVerifyText: { color: '#8B0000', fontSize: 13, fontWeight: '600' },
  actionButton: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 10 },
  actionButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  actionButtonIcon: { fontSize: 24, color: '#8B0000' },
  logoutButton: { backgroundColor: '#8B0000', marginHorizontal: 20, marginVertical: 30, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default ProfileScreen;