// Mobile/AshaSetu/screens/CampaignDetailsScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverRoot = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${serverRoot}${url}` : `${serverRoot}/${url}`;
};

export default function CampaignDetailsScreen({ route, navigation }) {
  const { campaign }    = route.params;
  const { token, user } = useContext(AuthContext);

  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount,  setDonationAmount]  = useState('');
  const [loading,         setLoading]         = useState(false);
  const [paymentStep,     setPaymentStep]     = useState('idle');

  const raised   = campaign.raised_amount || 0;
  const target   = campaign.target_amount || 1;
  const progress = Math.min((raised / target) * 100, 100);
  const daysLeft = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const resolvedImageUrl = getFullImageUrl(campaign.image_url);

  const QuickBtn = ({ amount }) => (
    <TouchableOpacity
      style={[styles.quickBtn, donationAmount === String(amount) && styles.quickBtnActive]}
      onPress={() => setDonationAmount(String(amount))}
    >
      <Text style={[styles.quickBtnText, donationAmount === String(amount) && styles.quickBtnTextActive]}>
        Rs. {amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  const getStepLabel = () => {
    switch (paymentStep) {
      case 'initiating': return 'Creating payment...';
      case 'waiting':    return 'Opening Khalti...';
      case 'verifying':  return 'Verifying payment...';
      default:           return 'Confirm Donation';
    }
  };

  const handleDonate = async () => {
    const amt = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amt) || amt < 10) {
      return Alert.alert('Invalid Amount', 'Minimum donation is Rs. 10');
    }

    setLoading(true);
    try {
      // STEP 1 — Initiate with our backend (backend calls Khalti)
      setPaymentStep('initiating');
      const initiateRes = await fetch(`${apiConfig.BASE_URL}/payment/initiate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaign_id: campaign.campaign_id,
          amount:      amt,
          donor_name:  user?.full_name || 'Anonymous',
        }),
      });
      const initiateData = await initiateRes.json();

      if (!initiateRes.ok || !initiateData.success) {
        setLoading(false);
        setPaymentStep('idle');
        return Alert.alert('Payment Error', initiateData.message || 'Could not start payment. Please try again.');
      }

      const { pidx, payment_url } = initiateData.data;

      // STEP 2 — Open Khalti payment page in in-app browser
      setPaymentStep('waiting');
      setShowDonateModal(false);

      await WebBrowser.openBrowserAsync(payment_url, {
        showTitle:          true,
        enableDefaultShare: false,
      });

      // STEP 3 — Verify after browser closes
      setPaymentStep('verifying');
      const verifyRes = await fetch(`${apiConfig.BASE_URL}/payment/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pidx }),
      });
      const verifyData = await verifyRes.json();

      setLoading(false);
      setPaymentStep('idle');
      setDonationAmount('');

      if (verifyData.success && verifyData.verified) {
        Alert.alert(
          '🎉 Donation Successful!',
          `Rs. ${amt.toLocaleString()} donated to ${campaign.patient_name}.\nThank you for your support! 🙏`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (verifyData.data?.status === 'cancelled') {
        Alert.alert('Payment Cancelled', 'Your payment was cancelled. No amount was charged.');
      } else {
        Alert.alert(
          '⏳ Payment Pending',
          'Your payment is being processed. If your amount was deducted, the donation will be confirmed shortly.'
        );
      }
    } catch (error) {
      console.error('Donation error:', error);
      setLoading(false);
      setPaymentStep('idle');
      Alert.alert('Error', 'Something went wrong. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {resolvedImageUrl ? (
            <Image source={{ uri: resolvedImageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="heart" size={60} color="#8B000040" />
              <Text style={styles.noImageText}>No photo added</Text>
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

        {/* Content */}
        <View style={styles.content}>
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

          <Text style={styles.sectionTitle}>Patient's Story</Text>
          <Text style={styles.story}>{campaign.story}</Text>

          <View style={styles.creatorRow}>
            <Ionicons name="person-circle-outline" size={20} color="#999" />
            <Text style={styles.creatorText}>
              Campaign by {campaign.creator_name || 'Community Member'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Donate Button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity style={styles.donateBtn} onPress={() => setShowDonateModal(true)}>
          <Text style={styles.khaltiPill}>🟣</Text>
          <Text style={styles.donateBtnText}>Donate via Khalti</Text>
        </TouchableOpacity>
      </View>

      {/* Donation Modal */}
      <Modal
        visible={showDonateModal}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!loading) setShowDonateModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Donation</Text>
              {!loading && (
                <TouchableOpacity onPress={() => setShowDonateModal(false)}>
                  <Ionicons name="close" size={26} color="#333" />
                </TouchableOpacity>
              )}
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

            {/* Quick amounts */}
            <Text style={styles.quickLabel}>Quick Select</Text>
            <View style={styles.quickRow}>
              <QuickBtn amount={100} />
              <QuickBtn amount={500} />
              <QuickBtn amount={1000} />
              <QuickBtn amount={5000} />
            </View>

            {/* Custom amount */}
            <Text style={styles.customLabel}>Custom Amount</Text>
            <View style={styles.amountBox}>
              <Text style={styles.rsLabel}>Rs.</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount (min. Rs. 10)"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={donationAmount}
                onChangeText={setDonationAmount}
                editable={!loading}
              />
            </View>

            {/* Khalti info */}
            <View style={styles.khaltiInfoBox}>
              <View style={styles.khaltiLogoRow}>
                <Text style={{ fontSize: 20 }}>🟣</Text>
                <Text style={styles.khaltiTitle}>Pay with Khalti</Text>
              </View>
              <Text style={styles.khaltiDesc}>
                You will be redirected to Khalti's secure page. Supports Khalti wallet, eBanking, mobile banking, and cards.
              </Text>
              {/* Sandbox test credentials reminder */}
              <View style={styles.testCredsBox}>
                <Text style={styles.testCredsTitle}>📋 Test Credentials (Sandbox)</Text>
                <Text style={styles.testCredsText}>Khalti ID: 9800000001  |  MPIN: 1111  |  OTP: 987654</Text>
              </View>
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleDonate}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.confirmBtnText}>{getStepLabel()}</Text>
                </View>
              ) : (
                <Text style={styles.confirmBtnText}>
                  {donationAmount && parseFloat(donationAmount) >= 10
                    ? `Donate Rs. ${parseFloat(donationAmount).toLocaleString()} via Khalti`
                    : 'Confirm Donation via Khalti'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.secureNote}>🔒 Secured by Khalti Payment Gateway</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  imageContainer:   { position: 'relative' },
  heroImage:        { width: '100%', height: 260, resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: 260, backgroundColor: '#fce4e4', alignItems: 'center', justifyContent: 'center', gap: 10 },
  noImageText:      { fontSize: 14, color: '#c08080', fontWeight: '500' },
  backBtn:          { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 8 },
  verifiedBadge:    { position: 'absolute', top: 16, right: 16, backgroundColor: '#4CAF50', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  verifiedText:     { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },

  content:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },
  titleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  urgentTag:   { backgroundColor: '#FF5252', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  urgentText:  { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  daysLeft:    { fontSize: 13, color: '#8B0000', fontWeight: '600' },
  patientName: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  condition:   { fontSize: 16, color: '#8B0000', fontWeight: '600', marginBottom: 12 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText:    { fontSize: 14, color: '#666', marginLeft: 6, flex: 1 },

  progressCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginVertical: 20, borderWidth: 1, borderColor: '#eee' },
  progressBar:  { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 5 },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raisedAmt:    { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  raisedLabel:  { fontSize: 12, color: '#999', marginTop: 2 },
  progressPct:  { fontSize: 18, fontWeight: 'bold', color: '#333' },
  donorCount:   { fontSize: 12, color: '#999', marginTop: 2 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 10 },
  story:        { fontSize: 15, color: '#555', lineHeight: 24, marginBottom: 20 },
  creatorRow:   { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee', marginBottom: 80 },
  creatorText:  { marginLeft: 6, fontSize: 13, color: '#999' },

  stickyBar:     { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  donateBtn:     { backgroundColor: '#5C2D8B', borderRadius: 12, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  khaltiPill:    { fontSize: 20 },
  donateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: 'bold', color: '#333' },

  patientSummary:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fce4e4', borderRadius: 12, padding: 12, marginBottom: 20 },
  patientIcon:      { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryName:      { fontSize: 15, fontWeight: '700', color: '#333' },
  summaryCondition: { fontSize: 13, color: '#8B0000', marginTop: 2 },

  quickLabel:        { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 10 },
  quickRow:          { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn:          { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 11, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  quickBtnActive:    { backgroundColor: '#5C2D8B', borderColor: '#5C2D8B' },
  quickBtnText:      { fontSize: 12, fontWeight: '600', color: '#333' },
  quickBtnTextActive:{ color: '#fff' },

  customLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  amountBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 14, marginBottom: 16 },
  rsLabel:     { fontSize: 17, fontWeight: '700', color: '#444', marginRight: 6 },
  amountInput: { flex: 1, paddingVertical: 13, fontSize: 17, color: '#333' },

  khaltiInfoBox:  { backgroundColor: '#F3EEFF', borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#D4B8FF' },
  khaltiLogoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  khaltiTitle:    { fontSize: 15, fontWeight: '700', color: '#5C2D8B' },
  khaltiDesc:     { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 10 },
  testCredsBox:   { backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#D4B8FF' },
  testCredsTitle: { fontSize: 11, fontWeight: '700', color: '#5C2D8B', marginBottom: 4 },
  testCredsText:  { fontSize: 11, color: '#444', lineHeight: 16 },

  confirmBtn:         { backgroundColor: '#5C2D8B', borderRadius: 12, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  confirmBtnDisabled: { backgroundColor: '#9B7DBB' },
  confirmBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secureNote:         { textAlign: 'center', fontSize: 12, color: '#999', marginTop: 12 },
});