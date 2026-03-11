// frontend/src/screens/HomeScreen.jsx
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

const HomeScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const quickActions = [
    {
      id: '1',
      title: 'Find Blood Donors',
      icon: '🩸',
      color: '#FFE5E5',
      action: () => console.log('Find Donors'),
      description: 'Search for nearby donors'
    },
    {
      id: '2',
      title: 'Request Blood',
      icon: '🏥',
      color: '#FFF4E5',
      action: () => console.log('Request Blood'),
      description: 'Create a blood request'
    },
    {
      id: '3',
      title: 'Donate Blood',
      icon: '❤️',
      color: '#E5F5FF',
      action: () => console.log('Donate Blood'),
      description: 'Register as a donor'
    },
    {
      id: '4',
      title: 'Volunteer',
      icon: '🤝',
      color: '#E5FFE5',
      action: () => console.log('Volunteer'),
      description: 'Join our team'
    }
  ];

  const recentActivities = [
    {
      id: '1',
      title: 'Blood Request Created',
      time: '2 days ago',
      type: 'request'
    },
    {
      id: '2',
      title: 'Profile Completed',
      time: '1 week ago',
      type: 'profile'
    }
  ];

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  useEffect(() => {
    // Prevent making API calls until the auth token is available
    if (!token) return;

    // Fetch initially and whenever the screen gains focus so new requests appear
    fetchBloodRequests();
    fetchNearbyEvents();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBloodRequests();
      fetchNearbyEvents();
    });
    return unsubscribe;
  }, [navigation, token, user?.profile?.city]);

  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      const url = `${apiConfig.BASE_URL}/blood/requests`;
      console.log('Fetching blood requests from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('Blood requests response:', data);

      if (response.ok && data.success) {
        // Only show strictly critical requests on Home emergency card
        const criticalRequests = data.data.filter(req => req.urgency_level === 'critical');
        setBloodRequests(criticalRequests);
      } else {
        console.log('Failed to fetch blood requests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching blood requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
    if (url.startsWith('/')) return `${base}${url}`;
    return `${base}/${url}`;
  };

  const fetchNearbyEvents = async () => {
    try {
      setLoadingEvents(true);
      const city = user?.profile?.city || user?.city || '';

      const buildUrl = (params) => {
        const query = new URLSearchParams(params).toString();
        return `${apiConfig.BASE_URL}/community/events?${query}`;
      };

      const baseParams = { status: 'upcoming', limit: 5 };
      if (city) baseParams.city = city;

      const response = await fetch(buildUrl(baseParams), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      let events = [];
      if (data.success) {
        events = data.data || [];
      }

      // If user has a city, try to top up with other upcoming events so we always show at least 5
      if (city && events.length < 5) {
        const responseAll = await fetch(buildUrl({ status: 'upcoming', limit: 5 }), {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const allData = await responseAll.json();
        if (allData.success) {
          const additional = (allData.data || []).filter(
            (e) => !events.some((existing) => existing.event_id === e.event_id)
          );
          events = [...events, ...additional].slice(0, 5);
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
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with User Info */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.full_name?.split(' ')[0] || 'User'}! 👋
            </Text>
          </View>
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.myOffersButton}
              onPress={() => navigation.navigate('MyDonationResponses')}
            >
              <MaterialCommunityIcons name="hand-heart-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* COMPACT Emergency Blood Request Card - Shows only most recent */}
        {loading ? (
          <View style={[styles.emergencyCard, { justifyContent: 'center', alignItems: 'center', minHeight: 120 }]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : bloodRequests.length > 0 ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>🚨 Emergency Blood Request</Text>
                {bloodRequests.length > 1 && (
                  <Text style={styles.emergencyCount}>+{bloodRequests.length - 1} more critical request{bloodRequests.length - 1 > 1 ? 's' : ''}</Text>
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

            {/* Show only the most recent request - COMPACT DESIGN */}
            <View style={styles.requestDetails}>
              <View style={styles.compactRow}>
                <View style={styles.compactLeft}>
                  <Text style={styles.patientNameLarge}>{bloodRequests[0].patient_name}</Text>
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
                  <FontAwesome5 name="calendar" size={12} color="rgba(255,255,255,0.9)" />
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
              onPress={() => navigation.navigate('RespondToRequest', { request: bloodRequests[0] })}
            >
              <MaterialCommunityIcons name="hand-heart" size={20} color="#8B0000" />
              <Text style={styles.respondButtonText}>I Can Help</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emergencyCard, { justifyContent: 'center', alignItems: 'center', minHeight: 120 }]}>
            <MaterialCommunityIcons name="heart-pulse" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.noRequestText}>No emergency requests at the moment</Text>
          </View>
        )}


        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('FindDonor')}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="account-group" size={28} color="#8B0000" />
            </View>
            <Text style={styles.actionLabel}>Find Donors</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('BloodRequestsFeed')}
          >
            <View style={styles.actionIconContainer}>
              <FontAwesome5 name="tint" size={24} color="#DC143C" />
            </View>
            <Text style={styles.actionLabel}>Blood Request</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Ambulance')}
          >
            <View style={styles.actionIconContainer}>
              <FontAwesome name="ambulance" size={26} color="#8B0000" />
            </View>
            <Text style={styles.actionLabel}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('FirstAid')}
          >
            <View style={styles.actionIconContainer}>
              <FontAwesome5 name="first-aid" size={24} color="#DC143C" />
            </View>
            <Text style={styles.actionLabel}>First Aid</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Events */}
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
                    onPress={() => navigation.navigate('EventDetails', { eventId: event.event_id })}
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
                    
                    {/* Days Until Badge */}
                    {daysUntil === 0 ? (
                      <View style={[styles.eventBadge, { backgroundColor: '#FF5252' }]}>
                        <Text style={styles.eventBadgeText}>TODAY</Text>
                      </View>
                    ) : daysUntil === 1 ? (
                      <View style={[styles.eventBadge, { backgroundColor: '#FF9800' }]}>
                        <Text style={styles.eventBadgeText}>TOMORROW</Text>
                      </View>
                    ) : (
                      <View style={[styles.eventBadge, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.eventBadgeText}>{daysUntil}D</Text>
                      </View>
                    )}

                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      
                      <View style={styles.eventMeta}>
                        <View style={styles.eventMetaRow}>
                          <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
                          <Text style={styles.eventMetaText} numberOfLines={1}>
                            {event.city}
                          </Text>
                        </View>
                        
                        <View style={styles.eventMetaRow}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                          <Text style={styles.eventMetaText}>
                            {event.start_time}
                          </Text>
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

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
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

        {/* Safety Tips */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>💡 Safety Tips</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipText}>
              • Always verify donor credentials before accepting blood
            </Text>
            <Text style={styles.tipText}>
              • Report any suspicious activity to admins
            </Text>
            <Text style={styles.tipText}>
              • Keep your medical history updated
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Donation')}
        >
          <MaterialCommunityIcons name="hand-coin" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Community')}
        >
          <MaterialCommunityIcons name="account-group-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={handleProfilePress}
        >
          <MaterialCommunityIcons name="account-outline" size={20} color="#8A8A8A" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollView: {
    flex: 1
  },
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20
  },
  headerTop: {
    flex: 1
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myOffersButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5
  },
  profileButton: {
    // Removed marginLeft since it's now in headerActions with gap
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B0000'
  },
  avatarTextSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  seeAll: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500'
  },
  // NEW COMPACT EMERGENCY CARD STYLES
  emergencyCard: {
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  emergencyCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    fontWeight: '500',
  },
  viewAllButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  requestDetails: {
    marginBottom: 14,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  compactLeft: {
    flex: 1,
    marginRight: 12,
  },
  patientNameLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 5,
  },
  compactText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
  },
  bloodBadgeCompact: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bloodBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  unitsBadgeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  bottomInfo: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  respondButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  respondButtonText: {
    color: '#8B0000',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  noRequestText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  // END COMPACT STYLES
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#E8E8E8',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#D0D0D0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  actionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center'
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  loadingEventsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingEventsText: {
    fontSize: 14,
    color: '#666',
  },
  eventCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  eventInfo: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventMeta: {
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  eventParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventParticipantsText: {
    fontSize: 12,
    color: '#8B0000',
    fontWeight: '500',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  noEventsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 8,
  },
  browseEventsText: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B0000',
    marginRight: 12
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3
  },
  activityTime: {
    fontSize: 12,
    color: '#999'
  },
  activityArrow: {
    fontSize: 18,
    color: '#8B0000',
    marginLeft: 10
  },
  tipsCard: {
    backgroundColor: '#FFF9E5',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000'
  },
  tipText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 4
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 10,
    flex: 1
  },
});

export default HomeScreen;