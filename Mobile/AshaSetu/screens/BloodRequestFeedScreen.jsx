import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

/**
 * Merged BloodRequestsFeedScreen
 * Combines old BloodRequestsFeedScreen and serves as the main request listing
 * - Shows all active requests (not expired)
 * - Displays countdown to expiry
 * - Shows urgency with color coding
 */
export default function BloodRequestsFeedScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [allRequests, setAllRequests] = useState([]);   // always holds full unfiltered list
  const [requests, setRequests] = useState([]);          // filtered view
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, critical, urgent, moderate

  // Re-apply filter whenever the filter value or the full list changes
  useEffect(() => {
    if (filter === 'all') {
      setRequests(allRequests);
    } else {
      setRequests(allRequests.filter(r => r.urgency_level === filter));
    }
  }, [filter, allRequests]);

  useEffect(() => {
    if (!token) return;
    loadBloodRequests();
  }, [token]);

  // Reload when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (token) loadBloodRequests();
    });
    return unsubscribe;
  }, [navigation, token]);

  const loadBloodRequests = async () => {
    try {
      setLoading(true);
      // Always fetch all requests — filtering is done client-side
      const url = `${apiConfig.BASE_URL}/blood/requests`;
      
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await resp.json();
      
      if (resp.ok && json.success) {
        setAllRequests(json.data || []);
      } else {
        console.warn('Failed to load blood requests:', json?.message || resp.status);
        setAllRequests([]);
      }
    } catch (error) {
      console.error('Error loading blood requests:', error);
      Alert.alert('Error', 'Failed to load blood requests');
      setAllRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBloodRequests();
  };

  const handleRespond = (request) => {
    navigation.navigate('RespondToRequest', { request });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return '#8B0000';
      case 'urgent':
        return '#9b5101';
      case 'moderate':
        return '#015604';
      default:
        return '#999';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'alert-circle';
      case 'urgent':
        return 'warning';
      case 'moderate':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;

    if (diffMs <= 0) {
      return { text: 'Expired', color: '#999' };
    }

    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return { 
        text: `${diffHours}h left`, 
        color: diffHours <= 6 ? '#FF1744' : '#FF9800' 
      };
    }

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { 
      text: `${diffDays}d left`, 
      color: '#dbdbdb' 
    };
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
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton label="All Requests" value="all" />
          <FilterButton label="🔴 Critical" value="critical" />
          <FilterButton label="🟠 Urgent" value="urgent" />
          <FilterButton label="🟡 Moderate" value="moderate" />
        </ScrollView>
      </View>

      {/* Create New Request Button */}
      <TouchableOpacity
        style={styles.createRequestBtn}
        onPress={() => navigation.navigate('BloodRequest')}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createRequestText}>+ Create New Request</Text>
      </TouchableOpacity>

      {/* Requests List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#8B0000"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="emoticon-happy-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No active requests</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Check back later or create a new request' 
                : 'No requests with this urgency level'}
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const urgencyColor = getUrgencyColor(request.urgency_level);
            const urgencyIcon = getUrgencyIcon(request.urgency_level);
            const timeRemaining = formatTimeRemaining(request.deadline);

            return (
              <View key={request.request_id} style={styles.requestCard}>
                {/* Top Banner: Urgency + Time Remaining */}
                <View style={[styles.urgencyBanner, { backgroundColor: urgencyColor }]}>
                  <Ionicons name={urgencyIcon} size={16} color="#fff" />
                  <Text style={styles.urgencyText}>
                    {request.urgency_level.toUpperCase()}
                  </Text>
                  <View style={styles.urgencyDivider} />
                  <Ionicons name="time" size={16} color="#fff" />
                  <Text style={[styles.urgencyText, { color: timeRemaining.color }]}>
                    {timeRemaining.text}
                  </Text>
                </View>

                {/* Blood Type Badge */}
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodGroupText}>{request.blood_group}</Text>
                  <Text style={styles.unitsText}>{request.units_needed} pint(s)</Text>
                </View>

                {/* Patient & Hospital Info */}
                <View style={styles.patientSection}>
                  <View style={styles.patientRow}>
                    <MaterialCommunityIcons name="account" size={20} color="#666" />
                    <Text style={styles.patientName}>{request.patient_name}</Text>
                  </View>

                  <View style={styles.hospitalRow}>
                    <Ionicons name="medical" size={18} color="#666" />
                    <View style={styles.hospitalInfo}>
                      <Text style={styles.hospitalName}>{request.hospital_name}</Text>
                      <Text style={styles.hospitalCity}>{request.hospital_city}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Ionicons name="calendar" size={18} color="#666" />
                    <Text style={styles.dateText}>
                      Deadline: {new Date(request.deadline).toLocaleDateString()} {new Date(request.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {request.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {request.description}
                    </Text>
                  </View>
                )}

                {/* Response Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="people" size={18} color="#666" />
                    <Text style={styles.statText}>
                      {request.total_responses} response(s)
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.statText}>
                      {request.confirmed_donors} confirmed
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {request.requester_id === user?.user_id ? (
                    // Owner view: Manage Responses
                    <TouchableOpacity
                      style={[styles.respondBtn, { flex: 1 }]}
                      onPress={() =>
                        navigation.navigate('ManageResponses', { requestId: request.request_id })
                      }
                    >
                      <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
                      <Text style={styles.respondBtnText}>
                        View {request.total_responses} Response{request.total_responses !== 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    // Donor view: I Can Help
                    <>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() =>
                          Alert.alert(
                            'Request Details',
                            `Patient: ${request.patient_name}\nBlood Group: ${request.blood_group}\nUnits: ${request.units_needed}\nUrgency: ${request.urgency_level}\nHospital: ${request.hospital_name}\nContact: ${request.hospital_contact}`
                          )
                        }
                      >
                        <Ionicons name="information-circle-outline" size={20} color="#8B0000" />
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.respondBtn}
                        onPress={() => handleRespond(request)}
                      >
                        <MaterialCommunityIcons name="hand-heart" size={20} color="#fff" />
                        <Text style={styles.respondBtnText}>I Can Help</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Requester Info */}
                <View style={styles.requesterSection}>
                  <Text style={styles.requesterLabel}>Posted by:</Text>
                  <Text style={styles.requesterName}>{request.requester_name}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Contact', `Phone: ${request.requester_phone}`)
                    }
                  >
                    <Text style={styles.requesterPhone}>{request.requester_phone}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  filterBtnActive: {
    backgroundColor: '#8B0000',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  createRequestBtn: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createRequestText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  urgencyDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  bloodBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#8B0000',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bloodGroupText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  unitsText: {
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
  },
  patientSection: {
    padding: 16,
    paddingRight: 90,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hospitalInfo: {
    marginLeft: 8,
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  hospitalCity: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B0000',
    gap: 6,
  },
  detailsBtnText: {
    color: '#8B0000',
    fontSize: 15,
    fontWeight: '600',
  },
  respondBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B0000',
    gap: 6,
  },
  respondBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  requesterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  requesterLabel: {
    fontSize: 12,
    color: '#999',
  },
  requesterName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  requesterPhone: {
    fontSize: 13,
    color: '#8B0000',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});