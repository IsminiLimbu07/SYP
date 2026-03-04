import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Image, ScrollView, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiConfig } from '../config/api';

const BLOOD_TYPES = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function FindDonorsScreen({ navigation }) {
  const [donors, setDonors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(apiConfig.ENDPOINTS.DONORS.GET_ALL, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        const json = await response.json();
        if (!json.success) throw new Error(json.message);
        setDonors(json.data);
        setFiltered(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDonors();
  }, []);

  useEffect(() => {
    let result = donors;
    if (selectedBlood !== 'All') {
      result = result.filter((d) => d.blood_group === selectedBlood);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (d) =>
          d.full_name.toLowerCase().includes(q) ||
          (d.city && d.city.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [searchText, selectedBlood, donors]);

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        {BLOOD_TYPES.map((type) => (
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
      {!loading && !error && filtered.length === 0 && (
        <Text style={styles.emptyText}>No donors found.</Text>
      )}

      {!loading && filtered.map((d) => (
        <View key={d.user_id} style={styles.card}>
          {d.profile_picture_url ? (
  <Image
    source={{ uri: d.profile_picture_url }}
    style={styles.avatar
    }
    
  />

) : (
  <View style={[styles.avatar, styles.avatarFallback]}>
    <Text style={styles.avatarText}>
      {d.full_name?.charAt(0).toUpperCase()}
    </Text>
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
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{d.blood_group || '?'}</Text>
          </View>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 15 },
  searchBox: {
    backgroundColor: '#f2f2f2', flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10,
    marginTop: 20, marginBottom: 12
  },
  input: { flex: 1, fontSize: 15 },
  chipsContainer: { flexDirection: 'row', marginBottom: 20 },
  chip: {
    borderWidth: 1, borderColor: '#8A0000', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 8
  },
  chipActive: { backgroundColor: '#8A0000' },
  chipText: { color: '#8A0000', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#f6f6f6', flexDirection: 'row', alignItems: 'center',
    borderRadius: 15, padding: 15, marginBottom: 15
  },
  avatar: { width: 55, height: 55, borderRadius: 50, marginRight: 15 },
  name: { fontSize: 17, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  location: { fontSize: 14, marginLeft: 5 },
  bloodBadge: {
    backgroundColor: '#8A0000', width: 45, height: 45,
    borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginLeft: 10
  },
  bloodText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btn: {
    backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginTop: 8, alignSelf: 'flex-start'
  },
  btnText: { color: '#fff', fontWeight: '600' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  avatarFallback: {
  backgroundColor: '#8A0000',
  justifyContent: 'center',
  alignItems: 'center',
},
avatarText: {
  color: '#fff',
  fontSize: 22,
  fontWeight: 'bold',
},
});