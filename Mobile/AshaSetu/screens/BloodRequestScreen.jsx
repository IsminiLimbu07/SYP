import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

/**
 * Refactored BloodRequestScreen
 * - User selects urgency level
 * - System automatically calculates deadline
 * - No manual date input required
 * - Auto-scrolls via KeyboardAvoidingView + ScrollView (same as LoginScreen)
 */
export default function BloodRequestScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  
  // Form state
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [description, setDescription] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [bloodGroupModal, setBloodGroupModal] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  const urgencyOptions = [
    { value: 'critical', label: 'Critical', deadline: '24 hours', color: '#FF1744' },
    { value: 'urgent',   label: 'Urgent',   deadline: '3 days',   color: '#FF9800' },
    { value: 'moderate', label: 'Moderate', deadline: '7 days',   color: '#4CAF50' },
  ];

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Session expired', 'Please login again to create a blood request.');
      return;
    }
    if (!patientName.trim()) { Alert.alert('Error', 'Please enter patient name'); return; }
    if (!bloodGroup)          { Alert.alert('Error', 'Please select blood group'); return; }
    if (!unitsNeeded || unitsNeeded < 1 || unitsNeeded > 20) { Alert.alert('Error', 'Units needed must be between 1 and 20'); return; }
    if (!urgencyLevel)        { Alert.alert('Error', 'Please select urgency level'); return; }
    if (!hospitalName.trim()) { Alert.alert('Error', 'Please enter hospital name'); return; }
    if (!contactNumber.trim()){ Alert.alert('Error', 'Please enter contact number'); return; }

    setLoading(true);
    try {
      const url = `${apiConfig.BASE_URL}/blood/request`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blood_group: bloodGroup,
          units_needed: parseInt(unitsNeeded),
          urgency_level: urgencyLevel,
          patient_name: patientName,
          hospital_name: hospitalName,
          hospital_address: hospitalAddress,
          contact_number: contactNumber,
          description: description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success ✅',
          'Blood request created successfully!\n\nIt will expire automatically based on the urgency level.',
          [{ text: 'OK', onPress: () => navigation.navigate('BloodRequestList') }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to create blood request');
      }
    } catch (error) {
      const errorMessage = typeof error === 'string'
        ? error
        : (error?.message || 'An error occurred while creating the request');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#8B0000" />
          <Text style={styles.infoBannerText}>
            Fill all required fields. The system will automatically set an expiry deadline based on urgency.
          </Text>
        </View>

        {/* Patient Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient name"
            placeholderTextColor="#999"
            returnKeyType="next"
          />
        </View>

        {/* Blood Group */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Blood Group *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setBloodGroupModal(true)}
          >
            <Text style={bloodGroup ? styles.dropdownTextFilled : styles.dropdownText}>
              {bloodGroup || 'Select Blood Group'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Blood Group Modal */}
        <Modal visible={bloodGroupModal} transparent animationType="slide">
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setBloodGroupModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Blood Group</Text>
              <View style={{ width: 50 }} />
            </View>
            <FlatList
              data={bloodGroups}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setBloodGroup(item);
                    setBloodGroupModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {bloodGroup === item && (
                    <Ionicons name="checkmark" size={20} color="#8B0000" />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Units Needed */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Units Needed (1-20) *</Text>
          <TextInput
            style={styles.input}
            value={unitsNeeded}
            onChangeText={setUnitsNeeded}
            placeholder="e.g., 2"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>

        {/* Urgency Level */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Urgency Level *</Text>
          <Text style={styles.urgencyHint}>System automatically sets expiry deadline</Text>

          {urgencyOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.urgencyOption,
                urgencyLevel === option.value && styles.urgencyOptionSelected,
                { borderLeftColor: option.color },
              ]}
              onPress={() => setUrgencyLevel(option.value)}
            >
              <View style={styles.urgencyOptionLeft}>
                <View style={[styles.urgencyDot, { backgroundColor: option.color }]} />
                <View>
                  <Text style={styles.urgencyOptionLabel}>{option.label}</Text>
                  <Text style={styles.urgencyDeadlineText}>Expires in {option.deadline}</Text>
                </View>
              </View>
              {urgencyLevel === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={option.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Hospital Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hospital Name *</Text>
          <TextInput
            style={styles.input}
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="Enter hospital name"
            placeholderTextColor="#999"
            returnKeyType="next"
          />
        </View>

        {/* Hospital Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hospital Address</Text>
          <TextInput
            style={styles.input}
            value={hospitalAddress}
            onChangeText={setHospitalAddress}
            placeholder="Enter hospital address (optional)"
            placeholderTextColor="#999"
            returnKeyType="next"
          />
        </View>

        {/* Contact Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Contact Number *</Text>
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="e.g., 9841234567"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Additional Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Patient condition, medical history, etc. (optional)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Create Request</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
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
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownTextFilled: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },

  // Urgency Level Styles
  urgencyHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderLeftWidth: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  urgencyOptionSelected: {
    borderColor: '#8B0000',
    backgroundColor: '#FFEBEE',
  },
  urgencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  urgencyOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  urgencyDeadlineText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
    paddingBottom: 14,
  },
  submitButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});