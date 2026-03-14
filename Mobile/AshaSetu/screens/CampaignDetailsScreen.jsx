import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function CampaignDetailsScreen({ route, navigation }) {
  const { campaign } = route.params;
  const { token, user } = useContext(AuthContext);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const raised = campaign.raised_amount || 0;
  const target = campaign.target_amount || 1;
  const progress = Math.min((raised / target) * 100, 100);
  const daysLeft = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const QuickBtn = ({ amount }) => (
    <TouchableOpacity
      style={[styles.quickBtn, donationAmount === String(amount) && styles.quickBtnActive]}
      onPress={() => setDonationAmount(String(amount))}>
      <Text style={[styles.quickBtnText, donationAmount === String(amount) && styles.quickBtnTextActive]}>
        Rs. {amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  const handleDonate = async () => {
    const amt = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amt) || amt < 10) {
      return Alert.alert('Invalid Amount', 'Minimum donation is Rs. 10');
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/campaigns/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaign_id: campaign.campaign_id,
          amount: amt,
          donor_name: user?.full_name || 'Anonymous',
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowDonateModal(false);
        setDonationAmount('');
        Alert.alert(
          '🙏 Thank You!',
          'Your donation has been recorded. Payment integration (Khalti) will be added soon.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to record donation');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {campaign.image_url ? (
            <Image source={{ uri: campaign.image_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="heart" size={60} color="#8B000040" />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {campaign.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <View style={styles.urgentTag}><Text style={styles.urgentText}>URGENT</Text></View>
            <Text style={[styles.daysLeft, daysLeft < 0 && { color: '#999' }]}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
            </Text>
          </View>

          <Text style={styles.patientName}>{campaign.patient_name}</Text>
          <Text style={styles.condition}>{campaign.condition}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="medical" size={16} color="#666" />
            <Text style={styles.infoText}>{campaign.hospital_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.infoText}>{campaign.city}</Text>
          </View>
          {campaign.age && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color="#666" />
              <Text style={styles.infoText}>Age: {campaign.age}</Text>
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressRow}>
              <View>
                <Text style={styles.raisedAmt}>Rs. {raised.toLocaleString()}</Text>
                <Text style={styles.raisedLabel}>raised of Rs. {campaign.target_amount?.toLocaleString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
                <Text style={styles.donorCount}>{campaign.donor_count || 0} donors</Text>
              </View>
            </View>
          </View>

          {/* Story */}
          <Text style={styles.sectionTitle}>Patient's Story</Text>
          <Text style={styles.story}>{campaign.story}</Text>

          {/* Created by */}
          <View style={styles.creatorRow}>
            <Ionicons name="person-circle-outline" size={20} color="#999" />
            <Text style={styles.creatorText}>Campaign by {campaign.creator_name || 'Community Member'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Donate Button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity style={styles.donateBtn} onPress={() => setShowDonateModal(true)}>
          <MaterialCommunityIcons name="hand-coin" size={22} color="#fff" />
          <Text style={styles.donateBtnText}>Donate Now</Text>
        </TouchableOpacity>
      </View>

      {/* Donation Modal */}
      <Modal visible={showDonateModal} transparent animationType="slide" onRequestClose={() => setShowDonateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Donation</Text>
              <TouchableOpacity onPress={() => setShowDonateModal(false)}>
                <Ionicons name="close" size={26} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Patient summary */}
            <View style={styles.patientSummary}>
              <View style={styles.patientIcon}>
                <Ionicons name="heart" size={26} color="#8B0000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryName}>{campaign.patient_name}</Text>
                <Text style={styles.summaryCondition}>{campaign.condition}</Text>
              </View>
            </View>

            <Text style={styles.quickLabel}>Quick Select</Text>
            <View style={styles.quickRow}>
              <QuickBtn amount={100} />
              <QuickBtn amount={500} />
              <QuickBtn amount={1000} />
              <QuickBtn amount={5000} />
            </View>

            <Text style={styles.customLabel}>Custom Amount</Text>
            <View style={styles.amountBox}>
              <Text style={styles.rsLabel}>Rs.</Text>
              <TextInput style={styles.amountInput} placeholder="Enter amount"
                placeholderTextColor="#bbb" keyboardType="numeric"
                value={donationAmount} onChangeText={setDonationAmount} />
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={18} color="#666" />
              <Text style={styles.noteText}>Payment via Khalti coming soon. Your donation will be recorded.</Text>
            </View>

            <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
              onPress={handleDonate} disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.confirmBtnText}>Confirm Donation</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  imageContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 240, resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%', height: 240, backgroundColor: '#fce4e4',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 8,
  },
  verifiedBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: '#4CAF50', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  urgentTag: { backgroundColor: '#FF5252', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  urgentText: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  daysLeft: { fontSize: 13, color: '#8B0000', fontWeight: '600' },
  patientName: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  condition: { fontSize: 16, color: '#8B0000', fontWeight: '600', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 14, color: '#666', marginLeft: 6, flex: 1 },
  progressCard: {
    backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginVertical: 20,
    borderWidth: 1, borderColor: '#eee',
  },
  progressBar: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raisedAmt: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  raisedLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  progressPct: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  donorCount: { fontSize: 12, color: '#999', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 10 },
  story: { fontSize: 15, color: '#555', lineHeight: 24, marginBottom: 20 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', marginBottom: 80 },
  creatorText: { marginLeft: 6, fontSize: 13, color: '#999' },
  stickyBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  donateBtn: {
    backgroundColor: '#8B0000', borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  donateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  patientSummary: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fce4e4',
    borderRadius: 12, padding: 12, marginBottom: 20,
  },
  patientIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  summaryName: { fontSize: 15, fontWeight: '700', color: '#333' },
  summaryCondition: { fontSize: 13, color: '#8B0000', marginTop: 2 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn: {
    flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 11, borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#ddd',
  },
  quickBtnActive: { backgroundColor: '#8B0000', borderColor: '#8B0000' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },
  quickBtnTextActive: { color: '#fff' },
  customLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  amountBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9',
    borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 14, marginBottom: 16,
  },
  rsLabel: { fontSize: 17, fontWeight: '700', color: '#444', marginRight: 6 },
  amountInput: { flex: 1, paddingVertical: 13, fontSize: 17, color: '#333' },
  noteBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF',
    borderRadius: 8, padding: 12, marginBottom: 20,
  },
  noteText: { marginLeft: 8, fontSize: 13, color: '#555', flex: 1, lineHeight: 18 },
  confirmBtn: { backgroundColor: '#8B0000', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});