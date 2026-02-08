import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function RespondToRequestScreen({ route, navigation }) {
  const { request } = route.params;
  const { token, user } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitResponse = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message to the requester');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/blood/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request_id: request.request_id,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Response Submitted',
          'Your donation offer has been sent to the requester. They will contact you if you are selected.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                // Optionally navigate to "My Responses" screen
                // navigation.navigate('MyDonationResponses');
              },
            },
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', error.message || 'Failed to submit your response. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Respond to Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={20} color="#8B0000" />
          <Text style={styles.infoBannerText}>
            You are offering to donate blood. The requester will review your response and may
            contact you.
          </Text>
        </View>

        {/* Request Summary */}
        <View style={styles.requestSummary}>
          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: getUrgencyColor(request.urgency_level) },
            ]}
          >
            <Text style={styles.urgencyText}>{request.urgency_level.toUpperCase()}</Text>
          </View>

          <View style={styles.bloodTypeCircle}>
            <Text style={styles.bloodTypeText}>{request.blood_group}</Text>
            <Text style={styles.unitsText}>{request.units_needed} pint(s)</Text>
          </View>

          <Text style={styles.patientName}>{request.patient_name}</Text>

          <View style={styles.detailRow}>
            <Ionicons name="medical" size={18} color="#666" />
            <Text style={styles.detailText}>{request.hospital_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#666" />
            <Text style={styles.detailText}>{request.hospital_city}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={18} color="#666" />
            <Text style={styles.detailText}>
              Needed by: {new Date(request.needed_by_date).toLocaleDateString()}
            </Text>
          </View>

          {request.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Case Details:</Text>
              <Text style={styles.descriptionText}>{request.description}</Text>
            </View>
          )}
        </View>

        {/* Your Blood Type Check */}
        <View style={styles.bloodCheckSection}>
          <Text style={styles.sectionTitle}>Your Blood Profile</Text>
          <View style={styles.bloodCheckCard}>
            <View style={styles.bloodCheckRow}>
              <Text style={styles.bloodCheckLabel}>Your Blood Type:</Text>
              <Text style={styles.bloodCheckValue}>
                {user?.blood_group || 'Not specified'}
              </Text>
            </View>

            {user?.blood_group && user.blood_group !== request.blood_group && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  Note: Your blood type ({user.blood_group}) doesn't match the requested type (
                  {request.blood_group}). Please confirm you can donate.
                </Text>
              </View>
            )}

            <View style={styles.bloodCheckRow}>
              <Text style={styles.bloodCheckLabel}>Last Donation:</Text>
              <Text style={styles.bloodCheckValue}>
                {user?.last_donation_date
                  ? new Date(user.last_donation_date).toLocaleDateString()
                  : 'Never'}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#2196F3" />
              <Text style={styles.infoText}>
                You should wait at least 3 months between blood donations
              </Text>
            </View>
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>Your Message to Requester</Text>
          <Text style={styles.messageHint}>
            Introduce yourself and confirm your availability
          </Text>

          <TextInput
            style={styles.messageInput}
            placeholder="Example: Hello, I have O+ blood and I'm available to donate. I can come to the hospital tomorrow morning. Please contact me at your earliest convenience."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.charCount}>{message.length} characters</Text>
        </View>

        {/* Quick Message Templates */}
        <View style={styles.templatesSection}>
          <Text style={styles.templateLabel}>Quick Templates:</Text>
          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() =>
              setMessage(
                `Hello, I am willing to donate ${request.blood_group} blood. I am available and can reach the hospital soon. Please contact me.`
              )
            }
          >
            <Text style={styles.templateText}>Standard Offer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() =>
              setMessage(
                `I have donated blood before and am ready to help. I can come to ${request.hospital_name} at your earliest convenience. My blood type is ${user?.blood_group || request.blood_group}.`
              )
            }
          >
            <Text style={styles.templateText}>Experienced Donor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateBtn}
            onPress={() =>
              setMessage(
                `I am available for immediate donation. Please call me to coordinate. I understand this is ${request.urgency_level}.`
              )
            }
          >
            <Text style={styles.templateText}>Urgent Response</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info Reminder */}
        <View style={styles.contactReminder}>
          <MaterialCommunityIcons name="phone-check" size={20} color="#4CAF50" />
          <Text style={styles.contactReminderText}>
            The requester will contact you at: {user?.phone_number}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmitResponse}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="hand-heart" size={24} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Donation Offer</Text>
            </>
          )}
        </TouchableOpacity>

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
  infoBanner: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  requestSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bloodTypeCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodTypeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  unitsText: {
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  descriptionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  bloodCheckSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bloodCheckCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bloodCheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bloodCheckLabel: {
    fontSize: 15,
    color: '#666',
  },
  bloodCheckValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 16,
  },
  messageSection: {
    marginBottom: 16,
  },
  messageHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  messageInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  templatesSection: {
    marginBottom: 16,
  },
  templateLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  templateBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  templateText: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500',
  },
  contactReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  contactReminderText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    gap: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#B8B8B8',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});