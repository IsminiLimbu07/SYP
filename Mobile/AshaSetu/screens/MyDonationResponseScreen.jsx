import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function MyDonationResponsesScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled

  useEffect(() => {
    loadMyResponses();
  }, []);

  const loadMyResponses = async () => {
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/blood/my-responses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setResponses(data.data);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      Alert.alert('Error', 'Failed to load your donation responses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMyResponses();
  };

  const handleCancelResponse = async (donationId, patientName) => {
    Alert.alert(
      'Cancel Response',
      `Are you sure you want to cancel your donation offer for ${patientName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${apiConfig.BASE_URL}/blood/respond/${donationId}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Cancelled', 'Your donation response has been cancelled.');
                loadMyResponses();
              } else {
                throw new Error(data.message);
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel response');
            }
          },
        },
      ]
    );
  };

  const handleCallRequester = (phone, name) => {
    Alert.alert('Call Requester', `Call ${name}?\n\nPhone: ${phone}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'cancelled':
        return '#999';
      case 'pending':
      default:
        return '#FF9800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'pending':
      default:
        return 'time';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return '#FF1744';
      case 'urgent':
        return '#FF9800';
      case 'normal':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const FilterButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterBtnText, filter === value && styles.filterBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading your responses...</Text>
      </View>
    );
  }

  const filteredResponses = responses.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Donation Offers</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton label="All" value="all" />
          <FilterButton label="Pending" value="pending" />
          <FilterButton label="Confirmed" value="confirmed" />
          <FilterButton label="Cancelled" value="cancelled" />
        </ScrollView>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{responses.length}</Text>
          <Text style={styles.statLabel}>Total Offers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {responses.filter((r) => r.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {responses.filter((r) => r.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      {/* Responses List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#8B0000']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredResponses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="hand-heart-outline" size={64} color="#DDD" />
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'No donation offers yet'
                : `No ${filter} responses`}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'Browse blood requests and offer to help'
                : 'Your responses will appear here'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('BloodRequestList')}
              >
                <Text style={styles.browseBtnText}>Browse Requests</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredResponses.map((response) => (
            <View key={response.donation_id} style={styles.responseCard}>
              {/* Status Banner */}
              <View
                style={[
                  styles.statusBanner,
                  { backgroundColor: getStatusColor(response.status) },
                ]}
              >
                <Ionicons name={getStatusIcon(response.status)} size={16} color="#fff" />
                <Text style={styles.statusBannerText}>
                  {response.status.toUpperCase()}
                </Text>
                {response.status === 'confirmed' && (
                  <>
                    <View style={styles.statusDivider} />
                    <MaterialCommunityIcons name="party-popper" size={16} color="#fff" />
                    <Text style={styles.statusBannerText}>You're helping save a life!</Text>
                  </>
                )}
              </View>

              {/* Request Info */}
              <View style={styles.requestInfo}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestDetails}>
                    <Text style={styles.patientName}>{response.patient_name}</Text>
                    <View style={styles.hospitalRow}>
                      <Ionicons name="medical" size={16} color="#666" />
                      <Text style={styles.hospitalText}>{response.hospital_name}</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={16} color="#666" />
                      <Text style={styles.locationText}>{response.hospital_city}</Text>
                    </View>
                  </View>

                  <View style={styles.bloodInfoCard}>
                    <View
                      style={[
                        styles.urgencyDot,
                        { backgroundColor: getUrgencyColor(response.urgency_level) },
                      ]}
                    />
                    <Text style={styles.bloodGroupLarge}>{response.blood_group}</Text>
                    <Text style={styles.unitsNeeded}>{response.units_needed} pints</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.dateText}>
                    Needed by: {new Date(response.needed_by_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Your Message */}
              {response.message && (
                <View style={styles.yourMessageBox}>
                  <Text style={styles.yourMessageLabel}>Your message:</Text>
                  <Text style={styles.yourMessageText}>{response.message}</Text>
                </View>
              )}

              {/* Response Timestamp */}
              <View style={styles.timestampRow}>
                <Ionicons name="time-outline" size={14} color="#999" />
                <Text style={styles.timestampText}>
                  Responded on {new Date(response.created_at).toLocaleDateString()} at{' '}
                  {new Date(response.created_at).toLocaleTimeString()}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {response.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.callRequesterBtn}
                    onPress={() =>
                      handleCallRequester(response.requester_phone, response.requester_name)
                    }
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.callRequesterText}>Call Requester</Text>
                  </TouchableOpacity>
                )}

                {response.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() =>
                        handleCallRequester(response.requester_phone, response.requester_name)
                      }
                    >
                      <Ionicons name="call-outline" size={18} color="#8B0000" />
                      <Text style={styles.contactBtnText}>Contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelResponseBtn}
                      onPress={() =>
                        handleCancelResponse(response.donation_id, response.patient_name)
                      }
                    >
                      <Ionicons name="close-outline" size={18} color="#F44336" />
                      <Text style={styles.cancelResponseText}>Cancel Offer</Text>
                    </TouchableOpacity>
                  </>
                )}

                {response.status === 'cancelled' && (
                  <View style={styles.cancelledNote}>
                    <Ionicons name="information-circle" size={16} color="#999" />
                    <Text style={styles.cancelledText}>This offer has been cancelled</Text>
                  </View>
                )}
              </View>

              {/* Request Status */}
              {response.request_status !== 'active' && (
                <View style={styles.requestStatusBanner}>
                  <Ionicons
                    name={
                      response.request_status === 'fulfilled'
                        ? 'checkmark-circle'
                        : 'close-circle'
                    }
                    size={16}
                    color={response.request_status === 'fulfilled' ? '#4CAF50' : '#999'}
                  />
                  <Text style={styles.requestStatusText}>
                    Request {response.request_status}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerTop: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  filterBtnActive: {
    backgroundColor: '#8B0000',
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  responseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  requestInfo: {
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  hospitalText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  bloodInfoCard: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    minWidth: 80,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  bloodGroupLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 2,
  },
  unitsNeeded: {
    fontSize: 12,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  yourMessageBox: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  yourMessageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  yourMessageText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  callRequesterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  callRequesterText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B0000',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  contactBtnText: {
    color: '#8B0000',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelResponseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelResponseText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelledNote: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelledText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  requestStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 6,
  },
  requestStatusText: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  bottomSpacing: {
    height: 20,
  },
});