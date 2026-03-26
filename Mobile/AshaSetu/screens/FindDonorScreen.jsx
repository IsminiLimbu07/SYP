import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Image, ScrollView, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiConfig } from '../config/api';

const BLOOD_TYPES = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const LOCAL_PROFILE_PIC_KEY = 'local_profile_picture_uri';

export default function FindDonorsScreen({ navigation }) {
  const [donors, setDonors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserPic, setCurrentUserPic] = useState(null);

  // Load current user ID and their local profile picture
  useEffect(() => {
    loadCurrentUser();
    loadCurrentUserPicture();
    
    // Add focus listener to reload picture when coming back from profile
    const unsubscribe = navigation.addListener('focus', () => {
      loadCurrentUserPicture();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id || user.user_id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadCurrentUserPicture = async () => {
    try {
      const savedPic = await AsyncStorage.getItem(LOCAL_PROFILE_PIC_KEY);
      if (savedPic) setCurrentUserPic(savedPic);
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  const fetchDonors = useCallback(async (blood, city) => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Not authenticated. Please login to view donors.');
        return;
      }

      // Build query string — only append params that are active
      const params = new URLSearchParams();
      if (blood && blood !== 'All') params.append('blood', blood);
      if (city && city.trim())      params.append('city', city.trim());

      const url = `${apiConfig.ENDPOINTS.DONORS.GET_ALL}${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setDonors(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever blood type filter changes immediately
  useEffect(() => {
    fetchDonors(selectedBlood, searchText);
  }, [selectedBlood]);

  // Debounce the city/name search so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDonors(selectedBlood, searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Get the picture for a donor
  const getDonorPicture = (donor) => {
    const donorId = donor.user_id || donor.id;
    
    // If this is the current logged-in user AND they have a locally saved picture
    if (currentUserId && donorId === currentUserId && currentUserPic) {
      console.log('📸 Using local pic for current user:', donor.full_name);
      return currentUserPic;
    }
    
    // For all other donors, use the server picture
    if (donor.profile_picture_url) {
      // If it's a relative path, make it absolute
      let picUrl = donor.profile_picture_url;
      if (!picUrl.startsWith('http')) {
        // Relative path - prepend the server base URL
        picUrl = `${apiConfig.SERVER_URL}${picUrl}`;
      }
      console.log('📸 Using server pic for:', donor.full_name, '→', picUrl);
      return picUrl;
    }
    
    return null;
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search by name or city..."
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Icon name="search" size={20} color="#555" />
      </View>

      <Text style={styles.filterLabel}>Blood Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        {BLOOD_TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, selectedBlood === type && styles.chipActive]}
            onPress={() => setSelectedBlood(type)}
          >
            <Text style={[styles.chipText, selectedBlood === type && styles.chipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator size="large" color="#8A0000" style={{ marginTop: 40 }} />}
      {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
      {!loading && !error && donors.length === 0 && (
        <Text style={styles.emptyText}>No donors found.</Text>
      )}

      {!loading && donors.map(d => {
        const donorPicture = getDonorPicture(d);
        
        return (
          <View key={d.user_id} style={styles.card}>
            {donorPicture ? (
              <Image source={{ uri: donorPicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{d.full_name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{d.full_name}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={16} color="#000" />
                <Text style={styles.location}>{d.city || 'Location not set'}</Text>
              </View>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.navigate('Profile', { donor: d })}
              >
                <Text style={styles.btnText}>View details</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.bloodBadge, !d.blood_group && styles.bloodBadgeEmpty]}>
              <Text style={styles.bloodText}>{d.blood_group || '?'}</Text>
            </View>
          </View>
        );
      })}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 15 },
  searchBox: {
    backgroundColor: '#f2f2f2', flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10,
    marginTop: 20, marginBottom: 8,
  },
  input: { flex: 1, fontSize: 15 },
  filterLabel: {
    fontSize: 12, fontWeight: '700', color: '#999',
    letterSpacing: 1.1, textTransform: 'uppercase',
    marginBottom: 6, marginTop: 4,
  },
  chipsContainer: { flexDirection: 'row', marginBottom: 16 },
  chip: {
    borderWidth: 1, borderColor: '#8A0000', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 8,
  },
  chipActive: { backgroundColor: '#8A0000' },
  chipText: { color: '#8A0000', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#f6f6f6', flexDirection: 'row', alignItems: 'center',
    borderRadius: 15, padding: 15, marginBottom: 15,
  },
  avatar: { width: 55, height: 55, borderRadius: 50, marginRight: 15 },
  avatarFallback: { backgroundColor: '#8A0000', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  name: { fontSize: 17, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  location: { fontSize: 14, marginLeft: 5 },
  bloodBadge: {
    backgroundColor: '#8A0000', width: 45, height: 45,
    borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginLeft: 10,
  },
  bloodBadgeEmpty: { backgroundColor: '#bbb' },
  bloodText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btn: {
    backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginTop: 8, alignSelf: 'flex-start',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
});