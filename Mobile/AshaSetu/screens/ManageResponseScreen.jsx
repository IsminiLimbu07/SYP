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

export default function ManageResponsesScreen({ route, navigation }) {
  const { requestId } = route.params;
  const { token } = useContext(AuthContext);
  const [request, setRequest] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequestAndResponses();
  }, []);

  const loadRequestAndResponses = async () => {
    try {
      // Load request details
      const requestResponse = await fetch(
        `${apiConfig.BASE_URL}/blood/request/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const requestData = await requestResponse.json();

      if (requestData.success) {
        setRequest(requestData.data);
      }

      // Load donation responses
      const responsesResponse = await fetch(
        `${apiConfig.BASE_URL}/blood/respond/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const responsesData = await responsesResponse.json();

      if (responsesData.success) {
        setResponses(responsesData.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load responses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequestAndResponses();
  };

  const handleConfirmDonor = async (donationId, donorName) => {
    Alert.alert(
      'Confirm Donor',
      `Are you sure you want to confirm ${donorName} as a donor? This will notify them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              const response = await fetch(
                `${apiConfig.BASE_URL}/blood/respond/${donationId}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: 'confirmed' }),
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', `${donorName} has been confirmed as a donor!`);
                loadRequestAndResponses();
              } else {
                throw new Error(data.message);
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to confirm donor');
            }
          },
        },
      ]
    );
  };

  const handleCancelResponse = async (donationId, donorName) => {
    Alert.alert(
      'Cancel Response',
      `Are you sure you want to cancel the response from ${donorName}?`,
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
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: 'cancelled' }),
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Cancelled', `Response from ${donorName} has been cancelled.`);
                loadRequestAndResponses();
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

  const handleCallDonor = (phone, name) => {
    Alert.alert('Call Donor', `Call ${name}?\n\nPhone: ${phone}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: () => Linking.openURL(`tel:${phone}`),
      },
    ]);
  };

  const handleMessageDonor = (phone, name) => {
    Linking.openURL(`sms:${phone}`);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading responses...</Text>
      </View>
    );
  }

  const pendingResponses = responses.filter((r) => r.status === 'pending');
  const confirmedResponses = responses.filter((r) => r.status === 'confirmed');
  const cancelledResponses = responses.filter((r) => r.status === 'cancelled');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Responses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#8B0000']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Request Summary */}
        {request && (
          <View style={styles.requestSummary}>
            <View style={styles.requestHeader}>
              <View>
                <Text style={styles.patientName}>{request.patient_name}</Text>
                <Text style={styles.hospitalName}>{request.hospital_name}</Text>
              </View>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{request.blood_group}</Text>
                <Text style={styles.unitsText}>{request.units_needed}p</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color="#666" />
                <Text style={styles.statText}>{responses.length} total</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={20} color="#FF9800" />
                <Text style={styles.statText}>{pendingResponses.length} pending</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statText}>{confirmedResponses.length} confirmed</Text>
              </View>
            </View>
          </View>
        )}

        {responses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="inbox" size={64} color="#DDD" />
            <Text style={styles.emptyText}>No responses yet</Text>
            <Text style={styles.emptySubtext}>
              Donors will appear here when they respond to your request
            </Text>
          </View>
        ) : (
          <>
            {/* Pending Responses */}
            {pendingResponses.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={22} color="#FF9800" />
                  <Text style={styles.sectionTitle}>Pending ({pendingResponses.length})</Text>
                </View>

                {pendingResponses.map((response) => (
                  <View key={response.donation_id} style={styles.responseCard}>
                    {/* Donor Header */}
                    <View style={styles.donorHeader}>
                      <View style={styles.donorAvatar}>
                        <Text style={styles.donorInitial}>
                          {response.donor_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.donorInfo}>
                        <Text style={styles.donorName}>{response.donor_name}</Text>
                        <View style={styles.donorMeta}>
                          {response.donor_blood_group && (
                            <View style={styles.bloodTypeBadge}>
                              <Text style={styles.bloodTypeText}>{response.donor_blood_group}</Text>
                            </View>
                          )}
                          <Text style={styles.donorPhone}>{response.donor_phone}</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(response.status) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(response.status)}
                          size={16}
                          color={getStatusColor(response.status)}
                        />
                        <Text
                          style={[styles.statusText, { color: getStatusColor(response.status) }]}
                        >
                          {response.status}
                        </Text>
                      </View>
                    </View>

                    {/* Donor Message */}
                    {response.message && (
                      <View style={styles.messageBox}>
                        <Text style={styles.messageLabel}>Message:</Text>
                        <Text style={styles.messageText}>{response.message}</Text>
                      </View>
                    )}

                    {/* Donor Details */}
                    {response.last_donation_date && (
                      <View style={styles.donorDetails}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          Last donated:{' '}
                          {new Date(response.last_donation_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.responseTime}>
                      <Ionicons name="time-outline" size={14} color="#999" />
                      <Text style={styles.responseTimeText}>
                        Responded {new Date(response.created_at).toLocaleString()}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() =>
                          handleCallDonor(response.donor_phone, response.donor_name)
                        }
                      >
                        <Ionicons name="call" size={18} color="#4CAF50" />
                        <Text style={styles.callBtnText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.messageBtn}
                        onPress={() =>
                          handleMessageDonor(response.donor_phone, response.donor_name)
                        }
                      >
                        <Ionicons name="chatbubble" size={18} color="#2196F3" />
                        <Text style={styles.messageBtnText}>Message</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() =>
                          handleConfirmDonor(response.donation_id, response.donor_name)
                        }
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.confirmBtnText}>Confirm</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() =>
                          handleCancelResponse(response.donation_id, response.donor_name)
                        }
                      >
                        <Ionicons name="close" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Confirmed Responses */}
            {confirmedResponses.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Confirmed ({confirmedResponses.length})</Text>
                </View>

                {confirmedResponses.map((response) => (
                  <View key={response.donation_id} style={styles.responseCard}>
                    <View style={styles.donorHeader}>
                      <View style={[styles.donorAvatar, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.donorInitial}>
                          {response.donor_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.donorInfo}>
                        <Text style={styles.donorName}>{response.donor_name}</Text>
                        <Text style={styles.donorPhone}>{response.donor_phone}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: '#4CAF5020' }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={[styles.statusText, { color: '#4CAF50' }]}>Confirmed</Text>
                      </View>
                    </View>

                    {response.message && (
                      <View style={styles.messageBox}>
                        <Text style={styles.messageText}>{response.message}</Text>
                      </View>
                    )}

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() =>
                          handleCallDonor(response.donor_phone, response.donor_name)
                        }
                      >
                        <Ionicons name="call" size={18} color="#4CAF50" />
                        <Text style={styles.callBtnText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.messageBtn}
                        onPress={() =>
                          handleMessageDonor(response.donor_phone, response.donor_name)
                        }
                      >
                        <Ionicons name="chatbubble" size={18} color="#2196F3" />
                        <Text style={styles.messageBtnText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Cancelled Responses (Collapsed) */}
            {cancelledResponses.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="close-circle" size={22} color="#999" />
                  <Text style={styles.sectionTitle}>Cancelled ({cancelledResponses.length})</Text>
                </View>

                {cancelledResponses.map((response) => (
                  <View key={response.donation_id} style={[styles.responseCard, styles.cancelledCard]}>
                    <View style={styles.donorHeader}>
                      <View style={[styles.donorAvatar, { backgroundColor: '#999' }]}>
                        <Text style={styles.donorInitial}>
                          {response.donor_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.donorInfo}>
                        <Text style={[styles.donorName, { color: '#999' }]}>
                          {response.donor_name}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: '#99999920' }]}>
                        <Ionicons name="close-circle" size={16} color="#999" />
                        <Text style={[styles.statusText, { color: '#999' }]}>Cancelled</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  requestSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hospitalName: {
    fontSize: 14,
    color: '#666',
  },
  bloodBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  unitsText: {
    fontSize: 11,
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
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
    paddingHorizontal: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  responseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelledCard: {
    opacity: 0.6,
  },
  donorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  donorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  donorInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  donorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bloodTypeBadge: {
    backgroundColor: '#8B000020',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bloodTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  donorPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  messageBox: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  donorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  responseTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  responseTimeText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cancelBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});