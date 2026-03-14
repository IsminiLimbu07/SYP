// frontend/src/screens/CommunityHomeScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

// apiConfig.BASE_URL is already set to your backend API base URL
// (e.g., http://192.168.1.4:9000/api)
const BASE = apiConfig.BASE_URL;

const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
};

export default function CommunityHomeScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [events, setEvents]                     = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [isVolunteer, setIsVolunteer]           = useState(user?.is_volunteer || false);
  const [registeredEvents, setRegisteredEvents] = useState({});
  const [registeringId, setRegisteringId]       = useState(null);

  useEffect(() => {
    if (!token) return;
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, token, user?.profile?.city]);

  const loadData = async () => {
    await Promise.all([loadEvents(), fetchMyStatus()]);
  };

  // GET <API_BASE>/community/events
  const loadEvents = async () => {
    try {
      const city = user?.profile?.city || user?.city || '';
      const params = new URLSearchParams({ status: 'upcoming' });
      if (city) params.append('city', city);

      const url = `${BASE}/community/events?${params.toString()}`;
      console.log('[Community] loadEvents ->', url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('[Community] events:', data.success, 'count:', data.data?.length);
      if (data.success) setEvents(data.data);
    } catch (error) {
      console.error('[Community] loadEvents error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // GET <API_BASE>/community/my-status
  const fetchMyStatus = async () => {
    try {
      const url = `${BASE}/community/my-status`;
      console.log('[Community] fetchMyStatus ->', url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('[Community] my-status:', data);
      if (data.success && data.data) {
        setIsVolunteer(data.data.is_volunteer || false);
      }
    } catch (error) {
      console.error('[Community] fetchMyStatus error:', error.message);
      setIsVolunteer(user?.is_volunteer || false);
    }
  };

  // POST <API_BASE>/community/become-volunteer
  const handleBecomeVolunteer = () => {
    Alert.alert(
      'Become a Volunteer',
      'As a volunteer you can organise blood donation events and help save lives. Anyone can join!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I want to help! 🙌',
          onPress: async () => {
            try {
              const url = `${BASE}/community/become-volunteer`;
              console.log('[Community] become-volunteer ->', url);
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              const data = await response.json();
              console.log('[Community] become-volunteer response:', data);
              if (data.success) {
                setIsVolunteer(true);
                Alert.alert(
                  '🎉 You are now a Volunteer!',
                  data.already_volunteer
                    ? 'You were already a volunteer!'
                    : 'You can now create blood donation events.',
                  [{ text: 'Awesome!' }]
                );
              } else {
                Alert.alert('Error', data.message || 'Could not register as volunteer.');
              }
            } catch (error) {
              console.error('[Community] become-volunteer error:', error.message);
              Alert.alert('Error', 'Network error. Please check your connection and try again.');
            }
          },
        },
      ]
    );
  };

  // POST / DELETE <API_BASE>/community/events/:id/register
  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    const alreadyRegistered = registeredEvents[eventId];
    try {
      const method = alreadyRegistered ? 'DELETE' : 'POST';
      const url = `${BASE}/community/events/${eventId}/register`;
      console.log(`[Community] ${method} register ->`, url);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: method === 'POST'
          ? JSON.stringify({ blood_group: user?.blood_group || null })
          : undefined,
      });
      const data = await response.json();
      console.log('[Community] register response:', data);
      if (data.success) {
        setRegisteredEvents((prev) => ({ ...prev, [eventId]: !alreadyRegistered }));
        setEvents((prev) =>
          prev.map((e) => {
            if (e.event_id !== eventId) return e;
            const delta = alreadyRegistered ? -1 : 1;
            return { ...e, current_participants: parseInt(e.current_participants || 0) + delta };
          })
        );
        Alert.alert(
          alreadyRegistered ? 'Unregistered' : '✅ Registered!',
          alreadyRegistered
            ? 'You have cancelled your registration.'
            : 'You are registered for this event!'
        );
      } else {
        Alert.alert('Error', data.message || 'Action failed.');
      }
    } catch (error) {
      console.error('[Community] register error:', error.message);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getEventStatus = (event) => {
    const today     = new Date();
    const eventDate = new Date(event.event_date);
    if (eventDate.toDateString() === today.toDateString()) return { text: 'TODAY',           color: '#FF5252' };
    if (eventDate < today)                                  return { text: 'COMPLETED',        color: '#999'    };
    const daysLeft = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft === 1)                                     return { text: 'TOMORROW',         color: '#FF9800' };
    return                                                         { text: `IN ${daysLeft} DAYS`, color: '#4CAF50' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading community…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        {isVolunteer && (
          <TouchableOpacity
            style={styles.createEventBtn}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.createEventText}>Create Event</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#8B0000']}
            tintColor="#8B0000"
          />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ── Chatroom Card ── */}
        <TouchableOpacity
          style={styles.chatroomCard}
          onPress={() => navigation.navigate('CommunityChatroom')}
          activeOpacity={0.85}
        >
          <View style={styles.chatroomIcon}>
            <MaterialCommunityIcons name="chat-processing" size={32} color="#fff" />
          </View>
          <View style={styles.chatroomContent}>
            <Text style={styles.chatroomTitle}>💬 Community Chatroom</Text>
            <Text style={styles.chatroomSubtitle}>Connect with donors and volunteers</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#8B0000" />
        </TouchableOpacity>

        {/* ── Volunteer Card ── */}
        {!isVolunteer ? (
          <TouchableOpacity
            style={styles.volunteerCard}
            onPress={handleBecomeVolunteer}
            activeOpacity={0.85}
          >
            <View style={styles.volunteerIconContainer}>
              <MaterialCommunityIcons name="hand-heart" size={40} color="#8B0000" />
            </View>
            <View style={styles.volunteerContent}>
              <Text style={styles.volunteerTitle}>⭐ Become a Volunteer</Text>
              <Text style={styles.volunteerSubtitle}>
                Help organise blood donation events and save lives
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#8B0000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.volunteerBadgeCard}>
            <MaterialCommunityIcons name="shield-star" size={28} color="#4CAF50" />
            <Text style={styles.volunteerBadgeText}>You are a verified Volunteer ✓</Text>
          </View>
        )}

        {/* ── Events Section ── */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-heart" size={24} color="#8B0000" />
          <Text style={styles.sectionTitle}>Upcoming Blood Donation Events</Text>
        </View>

        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#DDD" />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>
              {isVolunteer
                ? 'Tap "Create Event" above to organise one!'
                : 'Become a volunteer to organise events'}
            </Text>
          </View>
        ) : (
          events.map((event) => {
            const status        = getEventStatus(event);
            const participants  = parseInt(event.current_participants || 0);
            const maxP          = event.max_participants ? parseInt(event.max_participants) : null;
            const isFull        = maxP ? participants >= maxP : false;
            const isRegistered  = registeredEvents[event.event_id] || false;
            const isRegistering = registeringId === event.event_id;

            return (
              <TouchableOpacity
                key={event.event_id}
                style={styles.eventCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('EventDetails', { eventId: event.event_id })}
              >
                {event.image_url ? (
                  <Image source={{ uri: getFullImageUrl(event.image_url) }} style={styles.eventImage} />
                ) : (
                  <View style={styles.eventImagePlaceholder}>
                    <MaterialCommunityIcons name="water" size={48} color="#8B0000" style={{ opacity: 0.25 }} />
                  </View>
                )}

                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.text}</Text>
                </View>

                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>

                  <View style={styles.eventMeta}>
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.metaText}>
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.metaText}>{event.start_time} – {event.end_time}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.metaText}>{event.location}, {event.city}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="account" size={16} color="#666" />
                      <Text style={styles.metaText}>
                        By: <Text style={styles.metaTextBold}>{event.organizer_name}</Text>
                      </Text>
                    </View>
                  </View>

                  {event.description ? (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  ) : null}

                  {maxP ? (
                    <View style={styles.participantsSection}>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            { width: `${Math.min((participants / maxP) * 100, 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.participantsText}>{participants}/{maxP} Registered</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.registerBtn,
                      isFull && !isRegistered && styles.registerBtnDisabled,
                      isRegistered && styles.registerBtnRegistered,
                    ]}
                    onPress={() => handleRegister(event.event_id)}
                    disabled={(isFull && !isRegistered) || isRegistering}
                  >
                    {isRegistering ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name={isRegistered ? 'check-circle' : 'hand-heart'}
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.registerBtnText}>
                          {isRegistered ? 'Registered ✓' : isFull ? 'Full' : 'Register'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText:         { marginTop: 10, fontSize: 16, color: '#666' },
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle:    { fontSize: 20, fontWeight: '600', color: '#fff' },
  createEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createEventText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  scrollView:       { flex: 1 },
  scrollContent:    { padding: 16 },
  chatroomCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatroomIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatroomContent:  { flex: 1 },
  chatroomTitle:    { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  chatroomSubtitle: { fontSize: 13, color: '#666' },
  volunteerCard: {
    backgroundColor: '#FFF9E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  volunteerIconContainer: { marginRight: 12 },
  volunteerContent:  { flex: 1 },
  volunteerTitle:    { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  volunteerSubtitle: { fontSize: 13, color: '#666', lineHeight: 18 },
  volunteerBadgeCard: {
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    gap: 10,
  },
  volunteerBadgeText: { fontSize: 15, color: '#2E7D32', fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle:   { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText:      { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtext:   { fontSize: 14, color: '#BBB', marginTop: 8, textAlign: 'center' },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage:            { width: '100%', height: 180, resizeMode: 'cover' },
  eventImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F9ECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText:       { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  eventContent:     { padding: 16 },
  eventTitle:       { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  eventMeta:        { marginBottom: 12 },
  metaRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  metaText:         { fontSize: 14, color: '#666' },
  metaTextBold:     { fontWeight: '600', color: '#444' },
  eventDescription: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  participantsSection: { marginBottom: 14 },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar:      { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  participantsText: { fontSize: 13, color: '#666', fontWeight: '500' },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: '#8B0000',
    gap: 6,
  },
  registerBtnRegistered: { backgroundColor: '#4CAF50' },
  registerBtnDisabled:   { backgroundColor: '#BDBDBD' },
  registerBtnText:       { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  bottomSpacing:         { height: 20 },
});