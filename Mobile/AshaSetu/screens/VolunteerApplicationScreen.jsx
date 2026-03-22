import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { applyAsVolunteer } from '../api/volunteer';

const SKILLS = [
  { id: 'first_aid', label: 'First Aid', icon: 'medical' },
  { id: 'ambulance_driver', label: 'Ambulance Driver', icon: 'car' },
  { id: 'coordinator', label: 'Event Coordinator', icon: 'calendar' },
  { id: 'blood_donation', label: 'Blood Donation Expert', icon: 'water' },
  { id: 'emergency_response', label: 'Emergency Response', icon: 'alert-circle' },
  { id: 'community_outreach', label: 'Community Outreach', icon: 'people' },
];

const VolunteerApplicationScreen = ({ navigation }) => {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedSkills.length === 0) {
      Alert.alert('Required', 'Please select at least one skill');
      return;
    }

    if (reason.trim().length < 20) {
      Alert.alert('Required', 'Please provide a reason (minimum 20 characters)');
      return;
    }

    setLoading(true);
    try {
      const response = await applyAsVolunteer(selectedSkills, reason);
      
      if (response.success) {
        Alert.alert(
          'Success!',
          'Your volunteer application has been submitted. An admin will review it soon.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#8B0000" />
          <Text style={styles.infoText}>
            As an approved volunteer, you'll be able to create community events and campaigns to help others in need.
          </Text>
        </View>

        {/* Skills Selection */}
        <Text style={styles.sectionTitle}>Select Your Skills *</Text>
        <Text style={styles.sectionSubtitle}>Choose all that apply</Text>
        <View style={styles.skillsGrid}>
          {SKILLS.map((skill) => (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.skillCard,
                selectedSkills.includes(skill.id) && styles.skillCardSelected
              ]}
              onPress={() => toggleSkill(skill.id)}
            >
              <Ionicons
                name={skill.icon}
                size={28}
                color={selectedSkills.includes(skill.id) ? '#8B0000' : '#666'}
              />
              <Text style={[
                styles.skillLabel,
                selectedSkills.includes(skill.id) && styles.skillLabelSelected
              ]}>
                {skill.label}
              </Text>
              {selectedSkills.includes(skill.id) && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#8B0000" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Reason */}
        <Text style={styles.sectionTitle}>Why do you want to volunteer? *</Text>
        <Text style={styles.sectionSubtitle}>Minimum 20 characters</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Tell us why you want to help the community..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {reason.length}/20 characters
        </Text>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 14, color: '#856404', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#666', marginBottom: 12 },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  skillCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  skillCardSelected: {
    borderColor: '#8B0000',
    backgroundColor: '#fff5f5',
  },
  skillLabel: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center' },
  skillLabelSelected: { color: '#8B0000', fontWeight: '600' },
  checkmark: { position: 'absolute', top: 8, right: 8 },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 120,
  },
  characterCount: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 24 },
  submitButton: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default VolunteerApplicationScreen;