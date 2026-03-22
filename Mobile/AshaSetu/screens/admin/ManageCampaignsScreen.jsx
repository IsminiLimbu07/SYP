// Mobile/AshaSetu/screens/admin/ManageCampaignsScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getPendingCampaigns, approveCampaign, rejectCampaign } from '../../api/admin';
import { apiConfig } from '../../config/api';

const getFullImageUrl = (url) => {
  if (!url) return null;
  
  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Get the base server URL (e.g., http://localhost:9000)
  const serverRoot = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
  
  // If URL starts with /, prepend server root
  if (url.startsWith('/')) {
    return `${serverRoot}${url}`;
  }
  
  // Otherwise prepend with / and server root
  return `${serverRoot}/${url}`;
};

const StatusBadge = ({ status }) => {
  const colors = {
    pending:  { bg: '#FFF3E0', text: '#E65100' },
    active:   { bg: '#E8F5E9', text: '#2E7D32' },
    rejected: { bg: '#FFEBEE', text: '#C62828' },
  };
  const c = colors[status] || colors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

export default function ManageCampaignsScreen({ navigation }) {
  const { token } = useContext(AuthContext);

  const [campaigns,    setCampaigns]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  // Reject modal state
  const [rejectModal,       setRejectModal]       = useState(false);
  const [selectedCampaign,  setSelectedCampaign]  = useState(null);
  const [rejectionReason,   setRejectionReason]   = useState('');
  const [actionLoading,     setActionLoading]     = useState(false);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      const data = await getPendingCampaigns(token);
      setCampaigns(data.data || []);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to load pending campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = (campaign) => {
    Alert.alert(
      'Approve Campaign',
      `Approve campaign for "${campaign.patient_name}"?\n\nThis will make it live and visible to all users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await approveCampaign(token, campaign.campaign_id);
              Alert.alert('✅ Approved!', `Campaign for ${campaign.patient_name} is now live.`);
              setCampaigns((prev) => prev.filter((c) => c.campaign_id !== campaign.campaign_id));
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to approve campaign');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (campaign) => {
    setSelectedCampaign(campaign);
    setRejectionReason('');
    setRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return Alert.alert('Required', 'Please provide a rejection reason.');
    }
    setActionLoading(true);
    try {
      await rejectCampaign(token, selectedCampaign.campaign_id, rejectionReason.trim());
      Alert.alert('Campaign Rejected', 'The campaign has been rejected.');
      setCampaigns((prev) => prev.filter((c) => c.campaign_id !== selectedCampaign.campaign_id));
      setRejectModal(false);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to reject campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const daysLeft = (deadline) => {
    const d = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return d > 0 ? `${d} days left` : 'Deadline passed';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading pending campaigns...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header summary */}
      <View style={styles.summaryBar}>
        <Ionicons name="time-outline" size={18} color="#E65100" />
        <Text style={styles.summaryText}>
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} awaiting review
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} colors={['#8B0000']} tintColor="#8B0000" />
        }
      >
        {campaigns.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>No campaigns are pending review right now.</Text>
          </View>
        ) : (
          campaigns.map((c) => {
            const imageUrl = getFullImageUrl(c.image_url);
            return (
              <View key={c.campaign_id} style={styles.card}>

                {/* Image */}
                {imageUrl ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.cardImage}
                    onError={(error) => {
                      console.warn(`Failed to load image: ${imageUrl}`, error);
                    }}
                  />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Ionicons name="heart" size={32} color="#8B000030" />
                    <Text style={styles.noImageText}>No photo</Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  {/* Status + days */}
                  <View style={styles.topRow}>
                    <StatusBadge status={c.status || 'pending'} />
                    <Text style={styles.daysLeft}>{daysLeft(c.deadline)}</Text>
                  </View>

                  {/* Patient info */}
                  <Text style={styles.patientName}>{c.patient_name}</Text>
                  <Text style={styles.condition}>{c.condition}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons name="medical-outline" size={14} color="#888" />
                    <Text style={styles.infoText}>{c.hospital_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#888" />
                    <Text style={styles.infoText}>{c.city}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={14} color="#888" />
                    <Text style={styles.infoText}>
                      Target: Rs. {Number(c.target_amount).toLocaleString()}
                    </Text>
                  </View>

                  {/* Submitter */}
                  <View style={styles.creatorBox}>
                    <Ionicons name="person-circle-outline" size={16} color="#666" />
                    <Text style={styles.creatorText}>
                      Submitted by: {c.creator_name}
                    </Text>
                  </View>
                  <Text style={styles.creatorContact}>{c.creator_phone} · {c.creator_email}</Text>

                  {/* Story preview */}
                  <Text style={styles.story} numberOfLines={3}>{c.story}</Text>

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => openRejectModal(c)}
                      disabled={actionLoading}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#C62828" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(c)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={styles.approveText}>Approve & Go Live</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Campaign</Text>
              <TouchableOpacity onPress={() => setRejectModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedCampaign && (
              <Text style={styles.modalPatient}>
                Rejecting: <Text style={{ fontWeight: '700' }}>{selectedCampaign.patient_name}</Text>
              </Text>
            )}

            <Text style={styles.modalLabel}>Rejection Reason *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Explain why this campaign is being rejected (the creator will see this)..."
              placeholderTextColor="#aaa"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.modalRejectBtn, actionLoading && { opacity: 0.6 }]}
              onPress={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalRejectText}>Confirm Rejection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f5' },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  scroll:      { flex: 1 },

  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  summaryText: { fontSize: 14, color: '#E65100', fontWeight: '600' },

  empty:      { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#555', marginTop: 16, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardImage:            { width: '100%', height: 160, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 100, backgroundColor: '#fce4e4', alignItems: 'center', justifyContent: 'center', gap: 6 },
  noImageText:          { fontSize: 12, color: '#c08080' },

  cardBody: { padding: 16 },

  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  daysLeft: { fontSize: 12, color: '#8B0000', fontWeight: '600' },

  patientName: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  condition:   { fontSize: 14, color: '#8B0000', fontWeight: '600', marginBottom: 10 },

  infoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#777', marginLeft: 6, flex: 1 },

  creatorBox:     { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  creatorText:    { fontSize: 13, color: '#444', fontWeight: '600' },
  creatorContact: { fontSize: 12, color: '#888', marginTop: 2, marginLeft: 22, marginBottom: 10 },

  story: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 14 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },

  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  rejectText: { color: '#C62828', fontSize: 14, fontWeight: '700' },

  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalPatient: { fontSize: 14, color: '#555', marginBottom: 16 },
  modalLabel:   { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  modalInput:   {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    height: 110,
    marginBottom: 20,
  },
  modalRejectBtn: {
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalRejectText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});