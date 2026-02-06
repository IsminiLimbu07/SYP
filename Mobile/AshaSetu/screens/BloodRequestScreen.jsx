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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function BloodRequestScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalCity, setHospitalCity] = useState('');
  const [hospitalContact, setHospitalContact] = useState('');
  const [neededByDate, setNeededByDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [bloodGroupModal, setBloodGroupModal] = useState(false);
  const [urgencyModal, setUrgencyModal] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = ['critical', 'urgent', 'normal'];

  const handleSubmit = async () => {
    // Validation
    if (!patientName.trim()) {
      Alert.alert('Error', 'Please enter patient name');
      return;
    }
    if (!bloodGroup) {
      Alert.alert('Error', 'Please select blood group');
      return;
    }
    if (!unitsNeeded || unitsNeeded < 1 || unitsNeeded > 20) {
      Alert.alert('Error', 'Units needed must be between 1 and 20');
      return;
    }
    if (!urgencyLevel) {
      Alert.alert('Error', 'Please select urgency level');
      return;
    }
    if (!hospitalName.trim()) {
      Alert.alert('Error', 'Please enter hospital name');
      return;
    }
    if (!hospitalCity.trim()) {
      Alert.alert('Error', 'Please enter hospital city');
      return;
    }
    if (!hospitalContact.trim()) {
      Alert.alert('Error', 'Please enter hospital contact');
      return;
    }
    if (!neededByDate.trim()) {
      Alert.alert('Error', 'Please enter needed by date (YYYY-MM-DD)');
      return;
    }
setLoading(true);
    try {
      const url = `${apiConfig.BASE_URL}/blood/request`;
      console.log('Creating blood request at:', url);
      
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
          hospital_city: hospitalCity,
          hospital_contact: hospitalContact,
          needed_by_date: neededByDate,
          description: description,
        }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        Alert.alert('Success', 'Blood request created successfully', [
          { text: 'OK', onPress: () => navigation.navigate('BloodRequestsFeed') },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to create blood request');
      }
    } catch (error) {
      console.error('Error creating blood request:', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'An error occurred while creating the request');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Blood Request</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Text */}
        <Text style={styles.infoText}>
          Fill all the fields to request blood from the community. Your request will be visible to registered donors.
        </Text>

        {/* Patient Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Blood Group Dropdown */}
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
            placeholder="Enter number of units"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        {/* Urgency Level Dropdown */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Urgency Level *</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setUrgencyModal(true)}
          >
            <Text style={urgencyLevel ? styles.dropdownTextFilled : styles.dropdownText}>
              {urgencyLevel || 'Select Urgency Level'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Urgency Level Modal */}
        <Modal visible={urgencyModal} transparent animationType="slide">
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setUrgencyModal(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Urgency Level</Text>
              <View style={{ width: 50 }} />
            </View>
            <FlatList
              data={urgencyLevels}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setUrgencyLevel(item);
                    setUrgencyModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                  {urgencyLevel === item && (
                    <Ionicons name="checkmark" size={20} color="#8B0000" />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Hospital Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hospital Name *</Text>
          <TextInput
            style={styles.input}
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="Enter hospital name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Hospital Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hospital Address</Text>
          <TextInput
            style={styles.input}
            value={hospitalAddress}
            onChangeText={setHospitalAddress}
            placeholder="Enter hospital address"
            placeholderTextColor="#999"
          />
        </View>

        {/* Hospital City */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hospital City *</Text>
          <TextInput
            style={styles.input}
            value={hospitalCity}
            onChangeText={setHospitalCity}
            placeholder="Enter hospital city"
            placeholderTextColor="#999"
          />
        </View>

        {/* Hospital Contact */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Hospital Contact *</Text>
          <TextInput
            style={styles.input}
            value={hospitalContact}
            onChangeText={setHospitalContact}
            placeholder="Enter contact number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {/* Needed By Date */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Needed By Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            value={neededByDate}
            onChangeText={setNeededByDate}
            placeholder="2024-02-15"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any additional details..."
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
            <Text style={styles.submitButtonText}>Create Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '500',
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
  textArea: {
    height: 120,
    paddingTop: 14,
    paddingBottom: 14,
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
  submitButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  submitButtonDisabled: {
    opacity: 0.6,
  },
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});