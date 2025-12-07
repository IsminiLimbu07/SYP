import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AddBloodRequest() {
  const [patientName, setPatientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [localLevel, setLocalLevel] = useState('');
  const [hospital, setHospital] = useState('');
  const [requiredPint, setRequiredPint] = useState('');
  const [phone, setPhone] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [requiredTime, setRequiredTime] = useState('');
  const [caseDetail, setCaseDetail] = useState('');

  const handleProceed = () => {
    console.log('Proceed clicked', {
      patientName,
      contactPerson,
      bloodGroup,
      province,
      district,
      localLevel,
      hospital,
      requiredPint,
      phone,
      requiredDate,
      requiredTime,
      caseDetail,
    });
    // Add your form submission logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7f1d1d" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Blood Request</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Text */}
        <Text style={styles.infoText}>
          Fill all the fields to request required blood with the whole Nepali Blood Donors Community. It will help to find donor quickly.
        </Text>

        {/* Patient Name */}
        <TextInput
          style={styles.input}
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Patient Name:"
          placeholderTextColor="#999"
        />

        {/* Contact Person */}
        <TextInput
          style={styles.input}
          value={contactPerson}
          onChangeText={setContactPerson}
          placeholder="Contact Person"
          placeholderTextColor="#999"
        />

        {/* Blood Group Dropdown */}
        <TouchableOpacity style={styles.dropdown}>
          <Text style={bloodGroup ? styles.dropdownTextFilled : styles.dropdownText}>
            {bloodGroup || 'Select Blood Group'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Province Dropdown */}
        <TouchableOpacity style={styles.dropdown}>
          <Text style={province ? styles.dropdownTextFilled : styles.dropdownText}>
            {province || 'Select Province'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* District Dropdown */}
        <TouchableOpacity style={styles.dropdown}>
          <Text style={district ? styles.dropdownTextFilled : styles.dropdownText}>
            {district || 'Select District'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Local Level Dropdown */}
        <TouchableOpacity style={styles.dropdown}>
          <Text style={localLevel ? styles.dropdownTextFilled : styles.dropdownText}>
            {localLevel || 'Select Local Level'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Hospital */}
        <TextInput
          style={styles.input}
          value={hospital}
          onChangeText={setHospital}
          placeholder="Hospital"
          placeholderTextColor="#999"
        />

        {/* Required Pint */}
        <TextInput
          style={styles.input}
          value={requiredPint}
          onChangeText={setRequiredPint}
          placeholder="Required Pint"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />

        {/* Phone */}
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        {/* Required Date */}
        <TextInput
          style={styles.input}
          value={requiredDate}
          onChangeText={setRequiredDate}
          placeholder="Required Date YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        {/* Required Time */}
        <TouchableOpacity style={styles.timeInput}>
          <TextInput
            style={styles.timeInputText}
            value={requiredTime}
            onChangeText={setRequiredTime}
            placeholder="Required Time"
            placeholderTextColor="#999"
            editable={false}
          />
          <Ionicons name="time-outline" size={24} color="#666" />
        </TouchableOpacity>

        {/* Case Detail */}
        <TextInput
          style={[styles.input, styles.textArea]}
          value={caseDetail}
          onChangeText={setCaseDetail}
          placeholder="Case Detail"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Proceed Button */}
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>Proceed</Text>
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
    backgroundColor: '#7f1d1d',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
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
    color: '#000',
    lineHeight: 20,
    marginBottom: 20,
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownTextFilled: {
    fontSize: 16,
    color: '#333',
  },
  timeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeInputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  proceedButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});