// Mobile/AshaSetu/screens/admin/ManageEventsScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { apiConfig } from '../../config/api';

export default function ManageEventsScreen({ navigation }) {
  const { token } = useContext(AuthContext);

  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting]     = useState(null); // eventId currently being deleted

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
    return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
  };

  useEffect(() => {
    loadEvents();
    // Refresh list when navigating back to this screen
    const unsub = navigation.addListener('focus', loadEvents);
    return unsub;
  }, [navigation]);

  const loadEvents = async () => {
    try {
      // Fetch ALL events regardless of status so admin sees everything
      const response = await fetch(`${apiConfig.BASE_URL}/community/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEvents(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load events');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  const handleDeleteEvent = (event) => {
    Alert.alert(
      'Delete Event',
      `Permanently delete "${event.title}"?\n\nThis will also remove all participant registrations. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(event.event_id);
            try {
              const response = await fetch(
                `${apiConfig.BASE_URL}/community/events/${event.event_id}`,
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
                // Remove from local list immediately — no need to refetch
                setEvents(prev => prev.filter(e => e.event_id !== event.event_id));
                Alert.alert('Deleted', `"${event.title}" has been deleted.`);
              } else {
                Alert.alert('Error', data.message || 'Failed to delete event');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const filteredEvents = events.filter(e =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (event) => {
    const today     = new Date();
    const eventDate = new Date(event.event_date);
    if (event.status === 'cancelled') return { label: 'Cancelled', color: '#999' };
    if (eventDate < today)            return { label: 'Completed', color: '#4CAF50' };
    if (eventDate.toDateString() === today.toDateString()) return { label: 'Today', color: '#FF5252' };
    return { label: 'Upcoming', color: '#1565C0' };
  };

  const renderEventItem = ({ item }) => {
    const status        = getStatusStyle(item);
    const isBeingDeleted = deleting === item.event_id;

    return (
      <View style={styles.eventCard}>
        {/* Thumbnail */}
        {item.image_url ? (
          <Image
            source={{ uri: getFullImageUrl(item.image_url) }}
            style={styles.eventThumb}
          />
        ) : (
          <View style={[styles.eventThumb, styles.eventThumbPlaceholder]}>
            <MaterialCommunityIcons name="calendar-heart" size={32} color="#ddd" />
          </View>
        )}

        {/* Content */}
        <View style={styles.eventContent}>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusPill, { backgroundColor: status.color + '20', borderColor: status.color }]}>
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={13} color="#888" />
            <Text style={styles.metaText}>{item.organizer_name}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color="#888" />
            <Text style={styles.metaText}>
              {new Date(item.event_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color="#888" />
            <Text style={styles.metaText}>{item.city}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={13} color="#888" />
            <Text style={styles.metaText}>
              {item.current_participants || 0}
              {item.max_participants ? ` / ${item.max_participants}` : ''} registered
            </Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteBtn, isBeingDeleted && styles.deleteBtnDisabled]}
          onPress={() => handleDeleteEvent(item)}
          disabled={isBeingDeleted}
        >
          {isBeingDeleted ? (
            <ActivityIndicator size="small" color="#ff3b30" />
          ) : (
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{events.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {events.filter(e => new Date(e.event_date) >= new Date()).length}
          </Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {events.filter(e => new Date(e.event_date) < new Date()).length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, city or organizer..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#bbb"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.event_id.toString()}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B0000" />
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="calendar-remove" size={56} color="#ddd" />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term.' : 'No events have been created yet.'}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 4,
  },

  // Event card
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    alignItems: 'center',
  },
  eventThumb: {
    width: 80,
    height: '100%',
    minHeight: 110,
    resizeMode: 'cover',
  },
  eventThumbPlaceholder: {
    backgroundColor: '#f9ecec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },

  // Delete button
  deleteBtn: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },

  // Loading / empty
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
  },
});