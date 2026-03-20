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
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function CreateCampaignScreen({ navigation }) {
  const { token } = useContext(AuthContext);

  // ── Form fields ──────────────────────────────────────────────────────────────
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [story, setStory] = useState('');

  // ── Image state ──────────────────────────────────────────────────────────────
  const [imageUri, setImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [conditionModal, setConditionModal] = useState(false);

  const conditions = [
    'Kidney Transplant',
    'Heart Surgery',
    'Cancer Treatment',
    'Liver Transplant',
    'Brain Surgery',
    'Bone Marrow Transplant',
    'Accident / Trauma',
    'Burn Treatment',
    'Other',
  ];

  // ── Image picker ─────────────────────────────────────────────────────────────
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need camera roll permissions to select a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // ── Image upload (reuses the existing event-image endpoint) ──────────────────
  const uploadImage = async () => {
    if (!imageUri) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });

      const response = await fetch(`${apiConfig.BASE_URL}/upload/event-image`, {
        method: 'POST',
        headers: {
          // NOTE: Do NOT set Content-Type here — React Native sets it automatically
          // for FormData (including the boundary), and manually setting it breaks uploads.
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        console.log('[Campaign] Image uploaded:', data.imageUrl);
        return data.imageUrl;
      } else {
        console.warn('[Campaign] Image upload failed:', data.message);
        return null;
      }
    } catch (error) {
      console.error('[Campaign] Image upload error:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Form submission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!patientName.trim())
      return Alert.alert('Error', 'Please enter patient name');
    if (!condition)
      return Alert.alert('Error', 'Please select a medical condition');
    if (!hospitalName.trim())
      return Alert.alert('Error', 'Please enter hospital name');
    if (!city.trim())
      return Alert.alert('Error', 'Please enter city');
    if (!targetAmount || isNaN(targetAmount) || parseInt(targetAmount) < 1000)
      return Alert.alert('Error', 'Target amount must be at least Rs. 1,000');
    if (!deadline.trim())
      return Alert.alert('Error', 'Please enter deadline (YYYY-MM-DD)');
    if (!story.trim() || story.trim().length < 50)
      return Alert.alert('Error', 'Please write a story (at least 50 characters)');

    setLoading(true);
    try {
      // Upload image first if one was selected
      let image_url = null;
      if (imageUri) {
        image_url = await uploadImage();
        // Non-fatal: if upload fails we still create the campaign without an image
        if (!image_url) {
          console.warn('[Campaign] Continuing without image after upload failure.');
        }
      }

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
          image_url,           // null is fine — backend accepts it
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      {/* ── Header ── */}


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#8B0000" />
          <Text style={styles.infoText}>
            Fill in the patient's details accurately. Campaigns with complete information
            receive more support.
          </Text>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION: Campaign Photo  (NEW)
        ════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>Campaign Photo (Optional)</Text>

        <View style={styles.field}>
          {/* Image picker button */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              /* Preview of selected image */
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              /* Placeholder when no image is selected */
              <View style={styles.imagePlaceholderBox}>
                <Ionicons name="camera-outline" size={44} color="#ccc" />
                <Text style={styles.imagePlaceholderTitle}>Add a Photo</Text>
                <Text style={styles.imagePlaceholderSub}>
                  A good photo helps raise more funds
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Show remove / change buttons only after an image is chosen */}
          {imageUri && (
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={16} color="#8B0000" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="trash-outline" size={16} color="#F44336" />
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Upload progress indicator */}
          {uploadingImage && (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color="#8B0000" />
              <Text style={styles.uploadingText}>Uploading photo…</Text>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION: Patient Information
        ════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>Patient Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Full name of the patient"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 45"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>Medical Condition *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setConditionModal(true)}
            >
              <Text
                style={condition ? styles.dropdownFilled : styles.dropdownPlaceholder}
              >
                {condition || 'Select condition'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Condition picker modal */}
        <Modal visible={conditionModal} transparent animationType="slide">
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setConditionModal(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <View style={{ width: 50 }} />
            </View>
            <FlatList
              data={conditions}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCondition(item);
                    setConditionModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {condition === item && (
                    <Ionicons name="checkmark" size={20} color="#8B0000" />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION: Hospital Details
        ════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>Hospital Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Hospital Name *</Text>
          <TextInput
            style={styles.input}
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="e.g. Tribhuvan University Teaching Hospital"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Kathmandu"
            placeholderTextColor="#999"
          />
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION: Funding Goal
        ════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>Funding Goal</Text>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Target Amount (Rs.) *</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="e.g. 500000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Deadline (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="2025-12-31"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION: Patient's Story
        ════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>Patient's Story</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Tell their story * (min 50 characters)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={story}
            onChangeText={setStory}
            placeholder="Describe the patient's situation, why they need help, and how the funds will be used..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{story.length} characters</Text>
        </View>

        {/* ── Submit button ── */}
        <TouchableOpacity
          style={[styles.submitBtn, (loading || uploadingImage) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingImage}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="heart" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Create Campaign</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Info banner
  infoBanner: {
    backgroundColor: '#FFF9E5',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
    marginBottom: 24,
  },
  infoText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#555', lineHeight: 18 },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 12,
    marginTop: 8,
  },

  // Generic field wrapper
  field: { marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },

  // Text inputs
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: { height: 130, paddingTop: 12 },
  charCount: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 4 },

  // Dropdown
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownPlaceholder: { fontSize: 15, color: '#999' },
  dropdownFilled: { fontSize: 15, color: '#333', fontWeight: '500' },

  // ── Image upload styles ──────────────────────────────────────────────────────
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imagePlaceholderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#aaa',
  },
  imagePlaceholderSub: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  changePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#8B0000',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  changePhotoText: {
    color: '#8B0000',
    fontSize: 14,
    fontWeight: '600',
  },
  removePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  removePhotoText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 13,
    color: '#8B0000',
    fontWeight: '500',
  },
  // ── End image upload styles ──────────────────────────────────────────────────

  // Modal
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalClose: { fontSize: 16, color: '#8B0000', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: { fontSize: 16, color: '#333' },

  // Submit button
  submitBtn: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});