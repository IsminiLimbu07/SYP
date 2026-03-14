import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function CreateCampaignScreen({ navigation }) {
  const { token } = useContext(AuthContext);

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [conditionModal, setConditionModal] = useState(false);

  const conditions = [
    'Kidney Transplant', 'Heart Surgery', 'Cancer Treatment',
    'Liver Transplant', 'Brain Surgery', 'Bone Marrow Transplant',
    'Accident / Trauma', 'Burn Treatment', 'Other',
  ];

  const handleSubmit = async () => {
    if (!patientName.trim()) return Alert.alert('Error', 'Please enter patient name');
    if (!condition) return Alert.alert('Error', 'Please select a medical condition');
    if (!hospitalName.trim()) return Alert.alert('Error', 'Please enter hospital name');
    if (!city.trim()) return Alert.alert('Error', 'Please enter city');
    if (!targetAmount || isNaN(targetAmount) || parseInt(targetAmount) < 1000)
      return Alert.alert('Error', 'Target amount must be at least Rs. 1,000');
    if (!deadline.trim()) return Alert.alert('Error', 'Please enter deadline (YYYY-MM-DD)');
    if (!story.trim() || story.trim().length < 50)
      return Alert.alert('Error', 'Please write a story (at least 50 characters)');

    setLoading(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          age: age ? parseInt(age) : null,
          condition,
          hospital_name: hospitalName.trim(),
          city: city.trim(),
          target_amount: parseInt(targetAmount),
          deadline,
          story: story.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert(
          '🎉 Campaign Created!',
          'Your campaign has been submitted and will appear in the fundraising list.',
          [{ text: 'OK', onPress: () => navigation.navigate('Donation') }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to create campaign');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Create campaign error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Campaign</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#8B0000" />
          <Text style={styles.infoText}>
            Fill in the patient's details accurately. Campaigns with complete information receive more support.
          </Text>
        </View>

        {/* Patient Name */}
        <Text style={styles.sectionTitle}>Patient Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput style={styles.input} value={patientName} onChangeText={setPatientName}
            placeholder="Full name of the patient" placeholderTextColor="#999" />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge}
              placeholder="e.g. 45" placeholderTextColor="#999" keyboardType="number-pad" />
          </View>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>Medical Condition *</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setConditionModal(true)}>
              <Text style={condition ? styles.dropdownFilled : styles.dropdownPlaceholder}>
                {condition || 'Select condition'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Condition Modal */}
        <Modal visible={conditionModal} transparent animationType="slide">
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setConditionModal(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <View style={{ width: 50 }} />
            </View>
            <FlatList data={conditions} keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setCondition(item); setConditionModal(false); }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {condition === item && <Ionicons name="checkmark" size={20} color="#8B0000" />}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Hospital */}
        <Text style={styles.sectionTitle}>Hospital Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Hospital Name *</Text>
          <TextInput style={styles.input} value={hospitalName} onChangeText={setHospitalName}
            placeholder="e.g. Tribhuvan University Teaching Hospital" placeholderTextColor="#999" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City *</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity}
            placeholder="e.g. Kathmandu" placeholderTextColor="#999" />
        </View>

        {/* Funding */}
        <Text style={styles.sectionTitle}>Funding Goal</Text>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Target Amount (Rs.) *</Text>
            <TextInput style={styles.input} value={targetAmount} onChangeText={setTargetAmount}
              placeholder="e.g. 500000" placeholderTextColor="#999" keyboardType="number-pad" />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Deadline (YYYY-MM-DD) *</Text>
            <TextInput style={styles.input} value={deadline} onChangeText={setDeadline}
              placeholder="2025-12-31" placeholderTextColor="#999" />
          </View>
        </View>

        {/* Story */}
        <Text style={styles.sectionTitle}>Patient's Story</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Tell their story * (min 50 characters)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={story} onChangeText={setStory}
            placeholder="Describe the patient's situation, why they need help, and how the funds will be used..."
            placeholderTextColor="#999" multiline numberOfLines={6} textAlignVertical="top" />
          <Text style={styles.charCount}>{story.length} characters</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Ionicons name="heart" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Create Campaign</Text></>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#8B0000', paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  infoBanner: {
    backgroundColor: '#FFF9E5', flexDirection: 'row', alignItems: 'flex-start',
    padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#8B0000', marginBottom: 24,
  },
  infoText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#555', lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#8B0000', marginBottom: 12, marginTop: 8 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333',
  },
  textArea: { height: 130, paddingTop: 12 },
  charCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4 },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownPlaceholder: { fontSize: 15, color: '#999' },
  dropdownFilled: { fontSize: 15, color: '#333', fontWeight: '500' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalClose: { fontSize: 16, color: '#8B0000', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  modalItemText: { fontSize: 16, color: '#333' },
  submitBtn: {
    backgroundColor: '#8B0000', borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 8, elevation: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});