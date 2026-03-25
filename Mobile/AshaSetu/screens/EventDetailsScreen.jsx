import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { token, user } = useContext(AuthContext);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
    if (url.startsWith('/')) return `${base}${url}`;
    return `${base}/${url}`;
  };

  const [event, setEvent]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [registering, setRegistering]       = useState(false);
  const [isRegistered, setIsRegistered]     = useState(false);
  // ── RBAC flags ──────────────────────────────────────────────
  const [isOrganizer, setIsOrganizer]       = useState(false); // volunteer who owns this event
  const [isAdmin, setIsAdmin]               = useState(false); // admin can delete any event

  useEffect(() => {
    loadEventDetails();
  }, []);

  const loadEventDetails = async () => {
    try {
      const response = await fetch(
        `${apiConfig.BASE_URL}/community/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setEvent(data.data);
        // Check organizer: volunteer who created this specific event
        setIsOrganizer(data.data.organizer_id === user?.user_id);
        // Check admin: DB-verified flag from user context
        setIsAdmin(user?.is_admin === true);
        checkRegistrationStatus(data.data.organizer_id);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async (organizerId) => {
    try {
      const response = await fetch(
        `${apiConfig.BASE_URL}/community/events/${eventId}/participants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        // Organizers should never be considered registered, even if they have a record
        const isUserRegistered = data.data.some((p) => p.user_id === user?.user_id);
        const isUserOrganizer = organizerId === user?.user_id;
        setIsRegistered(isUserRegistered && !isUserOrganizer);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = () => {
    // Double-check: prevent organizers from registering even if UI shows register button
    if (isOrganizer) {
      Alert.alert('Error', 'You cannot register for your own event');
      return;
    }

    Alert.alert(
      'Register for Event',
      'Would you like to register for this blood donation event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            setRegistering(true);
            try {
              const response = await fetch(
                `${apiConfig.BASE_URL}/community/events/${eventId}/register`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ blood_group: user?.blood_group || null }),
                }
              );
              const data = await response.json();
              if (data.success) {
                Alert.alert('Success! 🎉', 'You are now registered for this event.');
                setIsRegistered(true);
                loadEventDetails();
              } else {
                Alert.alert('Error', data.message || 'Failed to register');
              }
            } catch (error) {
              console.error('Error registering:', error);
              Alert.alert('Error', 'Failed to register for event');
            } finally {
              setRegistering(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    const number = event?.contact_number || event?.organizer_phone;
    if (number) Linking.openURL(`tel:${number}`);
  };

  // ── Edit: only the volunteer who created the event ───────────
  const handleEditEvent = () => {
    navigation.navigate('CreateEvent', { eventId: event.event_id, event });
  };

  // ── Delete: only admin ────────────────────────────────────────
  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to permanently delete "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${apiConfig.BASE_URL}/community/events/${eventId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              const data = await response.json();
              if (data.success) {
                Alert.alert('Deleted', 'Event deleted successfully.', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                Alert.alert('Error', data.message || 'Failed to delete event');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const getEventStatus = () => {
    const today     = new Date();
    const eventDate = new Date(event.event_date);

    if (eventDate.toDateString() === today.toDateString()) {
      return { text: 'TODAY', color: '#FF5252', icon: 'alert-circle' };
    } else if (eventDate < today) {
      return { text: 'COMPLETED', color: '#999', icon: 'checkmark-circle' };
    } else {
      const daysLeft = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      if (daysLeft === 1) return { text: 'TOMORROW', color: '#FF9800', icon: 'time' };
      return { text: `IN ${daysLeft} DAYS`, color: '#4CAF50', icon: 'calendar' };
    }
  };

  // ── Loading / error states ────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="calendar-remove" size={64} color="#DDD" />
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status             = getEventStatus();
  const progressPercentage = event.max_participants
    ? (event.current_participants / event.max_participants) * 100
    : 0;
  const isFull = event.max_participants && event.current_participants >= event.max_participants;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Event Image */}
        {event.image_url ? (
          <Image source={{ uri: getFullImageUrl(event.image_url) }} style={styles.eventImage} />
        ) : (
          <View style={styles.eventImagePlaceholder}>
            <MaterialCommunityIcons name="calendar-heart" size={64} color="#DDD" />
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Ionicons name={status.icon} size={16} color="#fff" />
          <Text style={styles.statusText}>{status.text}</Text>
        </View>

        <View style={styles.content}>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Organizer */}
          <View style={styles.organizerSection}>
            <View style={styles.organizerAvatar}>
              <MaterialCommunityIcons name="account" size={24} color="#8B0000" />
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>Organized by</Text>
              <View style={styles.organizerNameRow}>
                <Text style={styles.organizerName}>{event.organizer_name}</Text>
                {event.organizer_is_volunteer && (
                  <View style={styles.volunteerBadge}>
                    <MaterialCommunityIcons name="shield-star" size={14} color="#fff" />
                    <Text style={styles.volunteerBadgeText}>Volunteer</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Ionicons name="calendar-outline" size={24} color="#8B0000" />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Ionicons name="time-outline" size={24} color="#8B0000" />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {event.start_time} - {event.end_time}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Ionicons name="location-outline" size={24} color="#8B0000" />
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{event.location}</Text>
            </View>

            <View style={styles.detailCard}>
              <Ionicons name="business-outline" size={24} color="#8B0000" />
              <Text style={styles.detailLabel}>City</Text>
              <Text style={styles.detailValue}>{event.city}</Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Address */}
          {event.address && (
            <View style={styles.addressSection}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#8B0000" />
              <Text style={styles.addressText}>{event.address}</Text>
            </View>
          )}

          {/* Participants Progress */}
          {event.max_participants && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>Registration</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(progressPercentage, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.participantsText}>
                {event.current_participants}/{event.max_participants} Registered
              </Text>
              {isFull && <Text style={styles.fullText}>Event is full</Text>}
            </View>
          )}

          {/* ── Action Buttons ─────────────────────────────────────── */}
          <View style={styles.actionsSection}>

            {/* Call organizer */}
            {(event.contact_number || event.organizer_phone) && (
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#8B0000" />
                <Text style={styles.callButtonText}>Call Organizer</Text>
              </TouchableOpacity>
            )}

            {/*
              EDIT BUTTON — only the volunteer who CREATED this event.
              Admins do NOT get edit; they get delete instead.
            */}
            {isOrganizer && (
              <TouchableOpacity
                style={[styles.callButton, styles.editButton]}
                onPress={handleEditEvent}
              >
                <Ionicons name="create-outline" size={20} color="#1565C0" />
                <Text style={[styles.callButtonText, { color: '#1565C0' }]}>Edit Event</Text>
              </TouchableOpacity>
            )}

            {/*
              DELETE BUTTON — only for admins.
              Regular volunteers (even the organizer) cannot delete events.
            */}
            {isAdmin && (
              <TouchableOpacity
                style={[styles.callButton, styles.deleteButton]}
                onPress={handleDeleteEvent}
              >
                <Ionicons name="trash-outline" size={20} color="#C62828" />
                <Text style={[styles.callButtonText, { color: '#C62828' }]}>Delete Event</Text>
              </TouchableOpacity>
            )}

            {/* Register / Already Registered / Organizer Note */}
            {isOrganizer ? (
              <View style={styles.organizerBadge}>
                <MaterialCommunityIcons name="account-star" size={24} color="#8B0000" />
                <Text style={styles.organizerText}>You organized this event</Text>
              </View>
            ) : isRegistered ? (
              <View style={styles.registeredBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.registeredText}>You're Registered!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (isFull || registering) && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isFull || registering}
              >
                {registering ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="hand-heart" size={24} color="#fff" />
                    <Text style={styles.registerButtonText}>
                      {isFull ? 'Event Full' : 'Register Now'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          {/* ──────────────────────────────────────────────────────── */}

        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B0000',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  eventImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 210,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  organizerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  organizerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  volunteerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  volunteerBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  participantsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  participantsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  fullText: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '600',
    marginTop: 4,
  },
  actionsSection: {
    gap: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B0000',
    gap: 8,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B0000',
  },
  // Edit button variant (blue border)
  editButton: {
    borderColor: '#1565C0',
  },
  // Delete button variant (red border)
  deleteButton: {
    borderColor: '#C62828',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#CCC',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  registeredText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  organizerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  organizerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B0000',
  },
});