// Mobile/AshaSetu/screens/HomeScreen.jsx
import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';
import { Animated } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [nearbyEvents, setNearbyEvents]   = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const slideAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  const safetyTips = [
    "Always verify donor credentials before accepting blood",
    "Report any suspicious activity to admins immediately",
    "Keep your medical history updated regularly",
    "Donate blood only at registered blood banks",
    "Stay hydrated — drink at least 500ml of water before donating",
    "Ensure at least 7–8 hours of rest the night before donation",
    "Check your hemoglobin levels before every donation",
    "Maintain a healthy iron-rich diet with leafy greens, lentils, and meat",
    "Never donate blood if you are feeling unwell or have a fever",
    "Wait at least 56 days (8 weeks) between whole blood donations",
    "Always carry your donor ID card to donation camps",
    "Inform medical staff about any medications you are currently taking",
    "Avoid alcohol for at least 24 hours before donating",
    "Eat a light, healthy meal 2–3 hours before donation",
    "Wear comfortable clothing with sleeves that roll up easily",
    "Relax and breathe calmly during the donation process",
    "Keep the bandage on for at least 4–5 hours after donation",
    "Avoid heavy lifting or strenuous exercise for 24 hours after donation",
    "Monitor the donation site for redness, swelling, or unusual reactions",
    "Share your donation experience to inspire friends and family",
    "Adults can donate blood up to 4 times a year safely",
    "One donation can save up to 3 lives",
    "Blood cannot be manufactured — donors are the only source",
    "Platelets must be used within 5 days — they are always in short supply",
    "Type O-negative is the universal donor — always needed in emergencies",
    "Type AB-positive is the universal plasma donor",
    "Eating vitamin C-rich foods helps your body absorb iron better",
    "Avoid fatty foods before donation — they can affect blood test results",
    "Avoid smoking for at least 2 hours before donation",
    "Light-headedness after donation is normal — sit for 10–15 min before standing",
    "If you feel faint after donating, lie down and raise your legs",
    "Snacks and juice after donation help restore blood sugar quickly",
    "Regular donors may have a lower risk of heart disease",
    "Donation takes 8–10 minutes; the full process takes about 30–45 min",
    "You must be 18–65 years old and weigh at least 45 kg to donate",
    "Pregnant women should wait 6 months after delivery before donating",
    "People with insulin-controlled diabetes are generally not eligible",
    "A tattoo or piercing requires a 6-month wait before donation",
    "Travel to malaria-risk areas requires a 3-month deferral",
    "Always donate at a licensed blood bank — never in informal settings",
    "Blood is screened for HIV, Hepatitis B, Hepatitis C, syphilis, and malaria",
    "Plasma donation can be done every 28 days",
    "Platelet donation (apheresis) can be done every 7 days, up to 24 times a year",
    "Coffee and tea reduce iron absorption — avoid them before donation",
    "A cold compress on the donation site helps reduce bruising",
    "Bruising at the needle site is common and fades within a week",
    "If bleeding continues after donation, apply firm pressure and seek help",
    "Donating blood does not weaken your immune system",
    "Your body replenishes donated blood volume within 24–48 hours",
    "Red blood cells are fully replaced within 4–6 weeks",
    "Your iron stores are restored within 20–30 days after donation",
    "Blood type is inherited — knowing yours is important medical information",
    "Rare blood types like Bombay (hh) group are critically needed — register if you have one",
    "Joining a bone marrow registry can save lives of blood cancer patients",
    "Cord blood banking at birth is a valuable source of stem cells",
    "Always keep your contact info updated in the donor registry so you can be reached in emergencies",
  ];

  const recentActivities = [
    { id: '1', title: 'Blood Request Created', time: '2 days ago', type: 'request' },
    { id: '2', title: 'Profile Completed', time: '1 week ago', type: 'profile' },
  ];

  useEffect(() => {
    if (!token) return;
    fetchBloodRequests();
    fetchNearbyEvents();
    fetchUnreadCount();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchBloodRequests();
      fetchNearbyEvents();
      fetchUnreadCount();
    });
    return unsubscribe;
  }, [navigation, token]);

  // ── Blood requests ──────────────────────────────────────────────────────────
  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiConfig.BASE_URL}/blood/requests`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBloodRequests(data.data.filter(r => r.urgency_level === 'critical'));
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Safety tip rotation ─────────────────────────────────────────────────────
  const rotateSafetyTip = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % safetyTips.length);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      rotateSafetyTip();
    }, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [rotateSafetyTip]);

  // ── Notification unread count ───────────────────────────────────────────────
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data?.length || 0);
      }
    } catch {
      // silent fail — badge simply stays at 0
    }
  };

  // ── Nearby events ───────────────────────────────────────────────────────────
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  };


  const fetchNearbyEvents = async () => {
    try {
      setLoadingEvents(true);
      const city = user?.profile?.city || user?.city || '';
      const baseParams = { status: 'upcoming', limit: 5 };
      if (city) baseParams.city = city;

      const buildUrl = (p) =>
        `${apiConfig.BASE_URL}/community/events?${new URLSearchParams(p)}`;

      const resp = await fetch(buildUrl(baseParams), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      let events = data.success ? data.data || [] : [];

      if (city && events.length < 5) {
        const resp2 = await fetch(buildUrl({ status: 'upcoming', limit: 5 }), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data2 = await resp2.json();
        if (data2.success) {
          const extra = (data2.data || []).filter(
            e => !events.some(ex => ex.event_id === e.event_id)
          );
          events = [...events, ...extra].slice(0, 5);
        }
      }
      setNearbyEvents(events);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.full_name?.split(' ')[0] || 'User'}! 👋
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* 🔔 Notification Bell */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* My donation offers */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('MyDonationResponses')}
            >
              <MaterialCommunityIcons name="hand-heart-outline" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Admin dashboard shortcut */}
            {user?.is_admin && (
              <TouchableOpacity
                style={[styles.iconButton, styles.adminIconButton]}
                onPress={() => navigation.navigate('AdminDashboard')}
              >
                <MaterialCommunityIcons name="shield-crown-outline" size={22} color="#FFD700" />
              </TouchableOpacity>
            )}

            {/* Profile avatar */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Emergency Blood Request Card ── */}
        {loading ? (
          <View style={[styles.emergencyCard, styles.centered]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : bloodRequests.length > 0 ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>🚨 Emergency Blood Request</Text>
                {bloodRequests.length > 1 && (
                  <Text style={styles.emergencyCount}>
                    +{bloodRequests.length - 1} more critical request
                    {bloodRequests.length - 1 > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.viewAllButtonCompact}
                onPress={() => navigation.navigate('BloodRequestsFeed')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.requestDetails}>
              <View style={styles.compactRow}>
                <View style={styles.compactLeft}>
                  <Text style={styles.patientNameLarge}>
                    {bloodRequests[0].patient_name}
                  </Text>
                  <View style={styles.compactInfo}>
                    <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.compactText}>{bloodRequests[0].hospital_city}</Text>
                  </View>
                </View>
                <View style={styles.bloodBadgeCompact}>
                  <Text style={styles.bloodBadgeText}>{bloodRequests[0].blood_group}</Text>
                  <Text style={styles.unitsBadgeText}>{bloodRequests[0].units_needed}p</Text>
                </View>
              </View>

              <View style={styles.bottomInfo}>
                <View style={styles.compactInfo}>
                  <MaterialCommunityIcons name="calendar-outline" size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.compactText}>
                    {new Date(bloodRequests[0].needed_by_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.compactInfo, { flex: 1 }]}>
                  <MaterialCommunityIcons name="hospital-building" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.compactText} numberOfLines={1}>
                    {bloodRequests[0].hospital_name}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.respondButton}
              onPress={() =>
                navigation.navigate('RespondToRequest', { request: bloodRequests[0] })
              }
            >
              <MaterialCommunityIcons name="hand-heart" size={20} color="#8B0000" />
              <Text style={styles.respondButtonText}>I Can Help</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emergencyCard, styles.centered, { minHeight: 120 }]}>
            <MaterialCommunityIcons name="heart-pulse" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.noRequestText}>No emergency requests at the moment</Text>
          </View>
        )}

        {/* ── Action Grid ── */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FindDonor')}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="account-group" size={28} color="#8B0000" />
            </View>
            <Text style={styles.actionLabel}>Find Donors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BloodRequestsFeed')}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="water-outline" size={24} color="#DC143C" />
            </View>
            <Text style={styles.actionLabel}>Blood Request</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Ambulance')}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="ambulance" size={26} color="#8B0000" />
            </View>
            <Text style={styles.actionLabel}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('FirstAid')}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#DC143C" />
            </View>
            <Text style={styles.actionLabel}>First Aid</Text>
          </TouchableOpacity>
        </View>

        {/* ── Nearby Events ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Nearby Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Community')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingEvents ? (
            <View style={styles.loadingEventsContainer}>
              <ActivityIndicator size="small" color="#8B0000" />
              <Text style={styles.loadingEventsText}>Loading events...</Text>
            </View>
          ) : nearbyEvents.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {nearbyEvents.map((event) => {
                const eventDate = new Date(event.event_date);
                const today = new Date();
                const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

                return (
                  <TouchableOpacity
                    key={event.event_id}
                    style={styles.eventCard}
                    onPress={() =>
                      navigation.navigate('EventDetails', { eventId: event.event_id })
                    }
                  >
                    {event.image_url ? (
                      <Image
                        source={{ uri: getFullImageUrl(event.image_url) }}
                        style={styles.eventImage}
                      />
                    ) : (
                      <View style={styles.eventImagePlaceholder}>
                        <MaterialCommunityIcons name="calendar-heart" size={40} color="#DDD" />
                      </View>
                    )}

                    <View style={[
                      styles.eventBadge,
                      { backgroundColor: daysUntil === 0 ? '#FF5252' : daysUntil === 1 ? '#FF9800' : '#4CAF50' },
                    ]}>
                      <Text style={styles.eventBadgeText}>
                        {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil}D`}
                      </Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <View style={styles.eventMetaRow}>
                          <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                          <Text style={styles.eventMetaText} numberOfLines={1}>{event.city}</Text>
                        </View>
                        <View style={styles.eventMetaRow}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                          <Text style={styles.eventMetaText}>{event.start_time}</Text>
                        </View>
                      </View>
                      {event.max_participants && (
                        <View style={styles.eventParticipants}>
                          <MaterialCommunityIcons name="account-group" size={14} color="#8B0000" />
                          <Text style={styles.eventParticipantsText}>
                            {event.current_participants}/{event.max_participants} registered
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#DDD" />
              <Text style={styles.noEventsText}>No upcoming events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Community')}>
                <Text style={styles.browseEventsText}>Browse Community →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {recentActivities.map(activity => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Text style={styles.activityArrow}>›</Text>
            </View>
          ))}
        </View>

        {/* ── Safety Tips Carousel ── */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💡 Safety Tips</Text>
          </View>

          <View style={styles.tipsCard}>
            {/* Card Header */}
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconWrap}>
                <MaterialCommunityIcons name="lightbulb-on" size={18} color="#FF9800" />
              </View>
              <Text style={styles.tipCounter}>
                {currentTipIndex + 1} / {safetyTips.length}
              </Text>
            </View>

            {/* Tip Text */}
            <Animated.View
              style={[
                styles.tipContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Text style={styles.tipText}>{safetyTips[currentTipIndex]}</Text>
            </Animated.View>

            {/* Progress bar only — no dots */}
            <View style={styles.tipProgressBar}>
              <View
                style={[
                  styles.tipProgressFill,
                  { width: `${((currentTipIndex + 1) / safetyTips.length) * 100}%` },
                ]}
              />
            </View>

            <Text style={styles.tipAutoRotateText}>
              Auto-advances every 15 seconds
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom Navigation Bar ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Donation')}>
          <MaterialCommunityIcons name="hand-coin" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Community')}>
          <MaterialCommunityIcons name="account-group-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <MaterialCommunityIcons name="account-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTop: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 16, color: '#fff', opacity: 0.8 },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 5 },

  // Icon buttons in header
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  adminIconButton: {
    borderColor: 'rgba(255,215,0,0.5)',
    backgroundColor: 'rgba(255,215,0,0.15)',
  },

  // Notification badge
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#ff3b30',
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#8B0000',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Profile button
  profileButton: {},
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#8B0000',
  },
  avatarTextSmall: { fontSize: 18, fontWeight: 'bold', color: '#8B0000' },

  // Emergency card
  emergencyCard: {
    backgroundColor: '#8B0000',
    marginHorizontal: 20, marginVertical: 15,
    padding: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
  },
  emergencyHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  emergencyTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', letterSpacing: 0.3 },
  emergencyCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3, fontWeight: '500' },
  viewAllButtonCompact: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 2,
  },
  viewAllText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  requestDetails: { marginBottom: 14 },
  compactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  compactLeft: { flex: 1, marginRight: 12 },
  patientNameLarge: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  compactInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 5 },
  compactText: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  bloodBadgeCompact: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center',
    minWidth: 60, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  bloodBadgeText: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  unitsBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
  bottomInfo: {
    flexDirection: 'row', gap: 12, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  respondButton: {
    backgroundColor: '#fff', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  respondButtonText: { color: '#8B0000', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.3 },
  noRequestText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 },

  // Action grid
  actionGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, justifyContent: 'space-between',
    marginTop: 10, marginBottom: 20,
  },
  actionCard: {
    width: '48%', backgroundColor: '#E8E8E8',
    padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15,
  },
  actionIconContainer: {
    width: 60, height: 60, backgroundColor: '#D0D0D0',
    borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionLabel: { fontSize: 14, color: '#333', fontWeight: '500', textAlign: 'center' },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  seeAll: { fontSize: 14, color: '#8B0000', fontWeight: '500' },

  // Events
  loadingEventsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
  loadingEventsText: { fontSize: 14, color: '#666' },
  eventCard: {
    width: 260, backgroundColor: '#fff', borderRadius: 12,
    marginRight: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  eventImage: { width: '100%', height: 140, resizeMode: 'cover' },
  eventImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  eventBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eventBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  eventInfo: { padding: 12 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, lineHeight: 20 },
  eventMeta: { marginBottom: 8 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
  eventMetaText: { fontSize: 12, color: '#666', flex: 1 },
  eventParticipants: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventParticipantsText: { fontSize: 12, color: '#8B0000', fontWeight: '500' },
  noEventsContainer: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff', borderRadius: 12 },
  noEventsText: { fontSize: 16, color: '#999', marginTop: 12, marginBottom: 8 },
  browseEventsText: { fontSize: 14, color: '#8B0000', fontWeight: '600' },

  // Activity
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingVertical: 12,
    paddingHorizontal: 15, borderRadius: 8, marginBottom: 8,
  },
  activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8B0000', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 3 },
  activityTime: { fontSize: 12, color: '#999' },
  activityArrow: { fontSize: 18, color: '#8B0000', marginLeft: 10 },

  // Tips Card
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tipsIconWrap: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 6,
  },
  tipCounter: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '700',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tipContent: {
    minHeight: 72,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 22,
    fontWeight: '500',
  },
  tipProgressBar: {
    height: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 10,
  },
  tipProgressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 2,
  },
  tipAutoRotateText: {
    fontSize: 11,
    color: '#BDBDBD',
    textAlign: 'right',
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#F2F2F2',
    paddingVertical: 8, paddingHorizontal: 20,
    justifyContent: 'space-around', borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 4,
  },
  navItem: { alignItems: 'center', paddingVertical: 10, flex: 1 },
});

export default HomeScreen;