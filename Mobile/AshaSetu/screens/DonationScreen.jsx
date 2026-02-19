import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { initiateKhaltiPayment } from '../payment/khaltiConfig';

export default function DonationCampaignsScreen({ navigation }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock data - Replace with API call
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    // TODO: Replace with actual API call
    const mockCampaigns = [
      {
        id: 1,
        patientName: 'Ram Bahadur Thapa',
        age: 45,
        condition: 'Kidney Transplant',
        hospital: 'Tribhuvan University Teaching Hospital',
        city: 'Kathmandu',
        targetAmount: 500000,
        raisedAmount: 125000,
        deadline: '2025-03-15',
        story: 'Ram Bahadur needs urgent kidney transplant surgery. He is a farmer from Sindhupalchok and cannot afford the treatment.',
        image: 'https://images.pexels.com/photos/3779697/pexels-photo-3779697.jpeg',
        createdBy: 'Sita Thapa',
        verified: true,
      },
      {
        id: 2,
        patientName: 'Anita Sharma',
        age: 12,
        condition: 'Heart Surgery',
        hospital: 'Shahid Gangalal National Heart Centre',
        city: 'Kathmandu',
        targetAmount: 800000,
        raisedAmount: 450000,
        deadline: '2025-02-28',
        story: 'Little Anita was born with a congenital heart defect. She needs immediate surgery to survive.',
        image: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg',
        createdBy: 'Dr. Krishna Sharma',
        verified: true,
      },
      {
        id: 3,
        patientName: 'Bikram Gurung',
        age: 32,
        condition: 'Cancer Treatment',
        hospital: 'B.P. Koirala Memorial Cancer Hospital',
        city: 'Bharatpur',
        targetAmount: 1200000,
        raisedAmount: 320000,
        deadline: '2025-04-20',
        story: 'Bikram is fighting leukemia and needs chemotherapy. He has a young family to support.',
        image: 'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg',
        createdBy: 'Maya Gurung',
        verified: false,
      },
    ];

    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 1000);
  };

  const calculateProgress = (raised, target) => {
    return Math.min((raised / target) * 100, 100);
  };

  const handleDonate = (campaign) => {
    setSelectedCampaign(campaign);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) < 10) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (minimum Rs. 10)');
      return;
    }

    const amount = parseFloat(donationAmount);
    const donorName = 'Anonymous Donor'; // Replace with actual user name

    try {
      const paymentResult = await initiateKhaltiPayment(
        amount,
        selectedCampaign.id,
        donorName,
        `Donation for ${selectedCampaign.patientName}`
      );

      if (paymentResult.success) {
        // Open Khalti payment page
        await Linking.openURL(paymentResult.paymentUrl);
        
        setShowPaymentModal(false);
        setDonationAmount('');
        
        // TODO: Set up deep linking to handle payment callback
        // and verify payment on backend
        
        Alert.alert(
          'Payment Initiated',
          'Complete payment in Khalti app. We will notify you once verified.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Payment Failed', paymentResult.error || 'Could not initiate payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
      console.error('Payment error:', error);
    }
  };

  const QuickAmountButton = ({ amount }) => (
    <TouchableOpacity
      style={styles.quickAmountBtn}
      onPress={() => setDonationAmount(amount.toString())}
    >
      <Text style={styles.quickAmountText}>Rs. {amount}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Campaign</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateCampaign')}>
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={20} color="#8B0000" />
        <Text style={styles.infoBannerText}>
          Help patients in need. 100% of donations go directly to medical expenses.
        </Text>
      </View>

      {/* Campaigns List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {campaigns.map((campaign) => {
          const progress = calculateProgress(campaign.raisedAmount, campaign.targetAmount);
          const daysLeft = Math.ceil(
            (new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)
          );

          return (
            <View key={campaign.id} style={styles.campaignCard}>
              {/* Campaign Image */}
              <Image source={{ uri: campaign.image }} style={styles.campaignImage} />

              {/* Verified Badge */}
              {campaign.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}

              {/* Campaign Details */}
              <View style={styles.campaignContent}>
                <View style={styles.campaignHeader}>
                  <View style={styles.urgentTag}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                  <Text style={styles.daysLeft}>{daysLeft} days left</Text>
                </View>

                <Text style={styles.patientName}>{campaign.patientName}</Text>
                <Text style={styles.condition}>{campaign.condition}</Text>

                <View style={styles.hospitalRow}>
                  <Ionicons name="medical" size={16} color="#666" />
                  <Text style={styles.hospitalText}>{campaign.hospital}</Text>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.locationText}>{campaign.city}</Text>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>

                  <View style={styles.amountRow}>
                    <View>
                      <Text style={styles.raisedAmount}>
                        Rs. {campaign.raisedAmount.toLocaleString()}
                      </Text>
                      <Text style={styles.raisedLabel}>raised</Text>
                    </View>
                    <View style={styles.targetContainer}>
                      <Text style={styles.targetAmount}>
                        Rs. {campaign.targetAmount.toLocaleString()}
                      </Text>
                      <Text style={styles.targetLabel}>goal</Text>
                    </View>
                  </View>
                </View>

                {/* Story Preview */}
                <Text style={styles.storyPreview} numberOfLines={2}>
                  {campaign.story}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() =>
                      navigation.navigate('CampaignDetails', { campaign })
                    }
                  >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.donateBtn}
                    onPress={() => handleDonate(campaign)}
                  >
                    <MaterialCommunityIcons
                      name="hand-coin"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.donateBtnText}>Donate Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Donation</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedCampaign && (
              <>
                <View style={styles.modalPatientInfo}>
                  <Image
                    source={{ uri: selectedCampaign.image }}
                    style={styles.modalPatientImage}
                  />
                  <View style={styles.modalPatientDetails}>
                    <Text style={styles.modalPatientName}>
                      {selectedCampaign.patientName}
                    </Text>
                    <Text style={styles.modalCondition}>
                      {selectedCampaign.condition}
                    </Text>
                  </View>
                </View>

                {/* Quick Amount Selection */}
                <Text style={styles.quickAmountLabel}>Quick Select Amount</Text>
                <View style={styles.quickAmountContainer}>
                  <QuickAmountButton amount={100} />
                  <QuickAmountButton amount={500} />
                  <QuickAmountButton amount={1000} />
                  <QuickAmountButton amount={5000} />
                </View>

                {/* Custom Amount Input */}
                <Text style={styles.inputLabel}>Or Enter Custom Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>Rs.</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={donationAmount}
                    onChangeText={setDonationAmount}
                  />
                </View>

                {/* Payment Info */}
                <View style={styles.paymentInfo}>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#4CAF50" />
                  <Text style={styles.paymentInfoText}>
                    Secure payment via Khalti
                  </Text>
                </View>

                {/* Donate Button */}
                <TouchableOpacity
                  style={styles.confirmDonateBtn}
                  onPress={processPayment}
                >
                  <Text style={styles.confirmDonateBtnText}>
                    Proceed to Payment
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    margin: -10, 
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 20,
    marginRight: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  infoBanner: {
    backgroundColor: '#FFF9E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  campaignCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  campaignContent: {
    padding: 16,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgentTag: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  daysLeft: {
    fontSize: 13,
    color: '#8B0000',
    fontWeight: '600',
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  condition: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '500',
    marginBottom: 12,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hospitalText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raisedAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  raisedLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  targetContainer: {
    alignItems: 'flex-end',
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  targetLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  storyPreview: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  viewDetailsText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  donateBtn: {
    flex: 1,
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  donateBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalPatientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  modalPatientDetails: {
    flex: 1,
  },
  modalPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCondition: {
    fontSize: 14,
    color: '#8B0000',
    marginTop: 2,
  },
  quickAmountLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  quickAmountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickAmountBtn: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    color: '#333',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  paymentInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  confirmDonateBtn: {
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDonateBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});