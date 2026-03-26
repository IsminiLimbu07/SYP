import React, { useState, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from "@react-native-community/datetimepicker"

import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function CreateEventScreen({ route, navigation }) {
  const { eventId, event: eventData } = route.params || {};
  const { token } = useContext(AuthContext);

  const isEditMode = !!eventId;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Event' : 'Create Event',
    });
  }, [navigation, isEditMode]);

  // Form state - initialize with event data if editing
  const [title, setTitle] = useState(eventData?.title || '');
  const [description, setDescription] = useState(eventData?.description || '');
  const [eventDate, setEventDate] = useState(eventData ? new Date(eventData.event_date) : new Date());
  const [startTime, setStartTime] = useState(eventData?.start_time ? (() => {
    const [hours, minutes] = eventData.start_time.split(':').map(Number);
    return new Date(0, 0, 0, hours, minutes);
  })() : new Date());
  const [endTime, setEndTime] = useState(eventData?.end_time ? (() => {
    const [hours, minutes] = eventData.end_time.split(':').map(Number);
    return new Date(0, 0, 0, hours, minutes);
  })() : new Date());
  const [location, setLocation] = useState(eventData?.location || '');
  const [city, setCity] = useState(eventData?.city || '');
  const [address, setAddress] = useState(eventData?.address || '');
  const [contactNumber, setContactNumber] = useState(eventData?.contact_number || '');
  const [maxParticipants, setMaxParticipants] = useState(eventData?.max_participants?.toString() || '');
  const [imageUri, setImageUri] = useState(null);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Request permissions and pick image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select an image.');
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Upload image to server (you'll need to implement this endpoint)
  const uploadImage = async () => {
    if (!imageUri) return null;

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

      console.log('📤 [CreateEvent] Uploading image:', filename, 'Type:', type);

      const response = await fetch(`${apiConfig.BASE_URL}/upload/event-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('[CreateEvent] Upload response not OK:', response.status);
        let errorMsg = 'Image upload failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // If response is not JSON, show status
          errorMsg = `Image upload failed (${response.status})`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Image upload failed');
      }

      console.log('✅ [CreateEvent] Image uploaded:', data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error('❌ [CreateEvent] Error uploading image:', error.message);
      Alert.alert('Upload Failed', error.message || 'Could not upload image. Creating event without image.');
      // Return a placeholder or null - we'll create event without image if upload fails
      return null;
    }
  };

  // Format date for API
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format time for API
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Validate form
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter event title');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Required', 'Please enter location');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Required', 'Please enter city');
      return false;
    }
    if (endTime <= startTime) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return false;
    }
    if (eventDate < new Date()) {
      Alert.alert('Invalid Date', 'Event date cannot be in the past');
      return false;
    }
    return true;
  };

  // Create event
  const handleCreateEvent = async () => {
    if (!token) {
      Alert.alert('Session expired', 'Please login again to create an event.');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Upload image first if selected
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage();
      }

      // Prepare event data
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        event_date: formatDate(eventDate),
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        location: location.trim(),
        city: city.trim(),
        address: address.trim() || null,
        contact_number: contactNumber.trim() || null,
        image_url: imageUrl,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      };

      console.log(`[${isEditMode ? 'Update' : 'Create'}Event] ${isEditMode ? 'Updating' : 'Creating'} event:`, eventData);

      const url = isEditMode
        ? `${apiConfig.BASE_URL}/community/events/${eventId}`
        : `${apiConfig.BASE_URL}/community/events`;

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      console.log(`[${isEditMode ? 'Update' : 'Create'}Event] Response:`, data);

      if (data.success) {
        Alert.alert(
          'Success! 🎉',
          `Event ${isEditMode ? 'updated' : 'created'} successfully! ${!isEditMode ? 'It will appear in the community feed.' : ''}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
      }
    } catch (error) {
      console.error(`[${isEditMode ? 'Update' : 'Create'}Event] Error:`, error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} event. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.content}>
            {/* Event Image */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Photo (Optional)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera-plus" size={48} color="#CCC" />
                    <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Text style={styles.removeImageText}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Event Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Blood Donation Camp - Kathmandu"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell people about this event..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Event Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {eventDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Start and End Time */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Start Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <MaterialCommunityIcons name="clock" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>
                End Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <MaterialCommunityIcons name="clock" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {endTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Location <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., TU Teaching Hospital"
                placeholderTextColor="#999"
                value={location}
                onChangeText={setLocation}
                maxLength={100}
              />
            </View>

            {/* City */}
            <View style={styles.section}>
              <Text style={styles.label}>
                City <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Kathmandu"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
                maxLength={50}
              />
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.label}>Full Address (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Maharajgunj, Kathmandu"
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
                maxLength={200}
              />
            </View>

            {/* Contact Number */}
            <View style={styles.section}>
              <Text style={styles.label}>Contact Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 9841234567"
                placeholderTextColor="#999"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Max Participants */}
            <View style={styles.section}>
              <Text style={styles.label}>Max Participants (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 100"
                placeholderTextColor="#999"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateEvent}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="calendar-heart" size={24} color="#fff" />
                  <Text style={styles.createButtonText}>{isEditMode ? 'Update Event' : 'Create Event'}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setEventDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {/* Start Time Picker */}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(Platform.OS === 'ios');
            if (selectedTime) {
              setStartTime(selectedTime);
            }
          }}
        />
      )}

      {/* End Time Picker */}
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(Platform.OS === 'ios');
            if (selectedTime) {
              setEndTime(selectedTime);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF0000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  removeImageBtn: {
    marginTop: 8,
    padding: 8,
  },
  removeImageText: {
    fontSize: 14,
    color: '#FF5252',
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  createButtonDisabled: {
    
    backgroundColor: '#CCC',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomSpacing: {
    height: 40,
  },
});