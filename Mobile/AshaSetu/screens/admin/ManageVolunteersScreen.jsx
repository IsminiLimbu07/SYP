import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import {
  getPendingVolunteerApplications,
  getAllVolunteers,
  approveVolunteer,
  rejectVolunteer,
  revokeVolunteerStatus,
} from '../../api/admin';

const ManageVolunteersScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [tab, setTab] = useState('pending'); // pending, approved
  const [pendingApps, setPendingApps] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'pending') {
        const res = await getPendingVolunteerApplications(token);
        setPendingApps(res.data || []);
      } else {
        const res = await getAllVolunteers(token);
        setVolunteers(res.data || []);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApprove = async (application) => {
    Alert.alert(
      'Approve Volunteer',
      `Approve ${application.full_name} as a volunteer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveVolunteer(token, application.user_id);
              Alert.alert('Success', `${application.full_name} approved as volunteer`);
              setModalVisible(false);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }

    try {
      await rejectVolunteer(token, selectedApp.user_id, rejectionReason);
      Alert.alert('Success', 'Application rejected');
      setRejectModalVisible(false);
      setModalVisible(false);
      setRejectionReason('');
      loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRevoke = async (volunteer) => {
    Alert.alert(
      'Revoke Volunteer Status',
      `Remove volunteer status from ${volunteer.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeVolunteerStatus(token, volunteer.user_id, 'Status revoked by admin');
              Alert.alert('Success', 'Volunteer status revoked');
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const renderPendingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { setSelectedApp(item); setModalVisible(true); }}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardName}>{item.full_name}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Pending</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          📍 {item.city || 'Not specified'} • 🩸 {item.blood_group || 'N/A'}
        </Text>
      </View>
      <Text style={styles.skillsText}>
        Skills: {item.skills?.join(', ') || 'None'}
      </Text>
      <Text style={styles.dateText}>
        Applied {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderVolunteerItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardName}>{item.full_name}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
        </View>
        <View style={styles.approvedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
          <Text style={styles.approvedBadgeText}>Approved</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          📍 {item.city || 'Not specified'} • 🩸 {item.blood_group || 'N/A'}
        </Text>
      </View>
      <Text style={styles.skillsText}>
        Skills: {item.skills?.join(', ') || 'None'}
      </Text>
      <Text style={styles.dateText}>
        Approved {new Date(item.volunteer_approved_at).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        style={styles.revokeButton}
        onPress={() => handleRevoke(item)}
      >
        <Text style={styles.revokeButtonText}>Revoke Status</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Pending ({pendingApps.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'approved' && styles.tabActive]}
          onPress={() => setTab('approved')}
        >
          <Text style={[styles.tabText, tab === 'approved' && styles.tabTextActive]}>
            Approved ({volunteers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#8B0000" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={tab === 'pending' ? pendingApps : volunteers}
          renderItem={tab === 'pending' ? renderPendingItem : renderVolunteerItem}
          keyExtractor={item => item.user_id?.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>
                {tab === 'pending' ? 'No pending applications' : 'No approved volunteers'}
              </Text>
            </View>
          }
        />
      )}

      {/* Application Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Application Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedApp && (
              <View style={styles.modalBody}>
                <Text style={styles.modalName}>{selectedApp.full_name}</Text>
                <Text style={styles.modalEmail}>{selectedApp.email}</Text>
                <Text style={styles.modalPhone}>{selectedApp.phone_number}</Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Skills</Text>
                  <Text style={styles.modalSectionText}>
                    {selectedApp.skills?.join(', ') || 'None'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Reason for Volunteering</Text>
                  <Text style={styles.modalSectionText}>{selectedApp.reason}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Additional Info</Text>
                  <Text style={styles.modalSectionText}>
                    City: {selectedApp.city || 'Not specified'}{'\n'}
                    Blood Group: {selectedApp.blood_group || 'Not specified'}{'\n'}
                    Applied: {new Date(selectedApp.created_at).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.approveButton]}
                    onPress={() => handleApprove(selectedApp)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButton]}
                    onPress={() => setRejectModalVisible(true)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Rejection Reason</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Why are you rejecting this application?"
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              textAlignVertical="top"
            />
            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={[styles.rejectActionButton, styles.cancelButton]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.rejectActionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectActionButton, styles.confirmRejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.rejectActionButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#8B0000' },
  tabText: { fontSize: 15, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#8B0000', fontWeight: '600' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  pendingBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: '#f57c00' },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  approvedBadgeText: { fontSize: 11, fontWeight: '600', color: '#4caf50' },
  cardMeta: { marginBottom: 8 },
  metaText: { fontSize: 13, color: '#666' },
  skillsText: { fontSize: 13, color: '#333', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#999' },
  revokeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  revokeButtonText: { fontSize: 13, fontWeight: '600', color: '#f44336' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 20 },
  modalName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  modalEmail: { fontSize: 14, color: '#666', marginBottom: 2 },
  modalPhone: { fontSize: 14, color: '#666', marginBottom: 16 },
  modalSection: { marginBottom: 16 },
  modalSectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  modalSectionText: { fontSize: 14, color: '#333', lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  approveButton: { backgroundColor: '#4caf50' },
  rejectButton: { backgroundColor: '#f44336' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rejectModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  rejectInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    marginBottom: 16,
  },
  rejectActions: { flexDirection: 'row', gap: 12 },
  rejectActionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#e0e0e0' },
  confirmRejectButton: { backgroundColor: '#f44336' },
  rejectActionButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default ManageVolunteersScreen;