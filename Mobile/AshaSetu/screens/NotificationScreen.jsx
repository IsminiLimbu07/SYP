// frontend/src/screens/NotificationsScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

const NPT = 'Asia/Kathmandu';

// Safely parse any timestamp string as UTC (appends 'Z' if missing)
const parseUTC = (str) => {
  if (!str) return new Date();
  const s = typeof str === 'string' ? str : str.toISOString();
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z');
};

// Always show exact NPT date + time — e.g. "Mar 20, 11:45 AM"
// On the same day just show the time — e.g. "11:45 AM"
const formatTime = (dateStr) => {
  const date = parseUTC(dateStr);
  const now  = new Date();

  // Compare calendar dates in NPT
  const dateDay = date.toLocaleDateString('en-US', { timeZone: NPT, year: 'numeric', month: '2-digit', day: '2-digit' });
  const today   = now.toLocaleDateString('en-US',  { timeZone: NPT, year: 'numeric', month: '2-digit', day: '2-digit' });

  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: NPT,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (dateDay === today) {
    // Same day — just show time
    return timeStr;
  }

  // Different day — show "Mar 20, 11:45 AM"
  const dateLabel = date.toLocaleDateString('en-US', {
    timeZone: NPT,
    month: 'short',
    day: 'numeric',
  });
  return `${dateLabel}, ${timeStr}`;
};

const NotificationsScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getSeverityColor = (severity, type) => {
    if (type === 'sos') return '#ff3b30';
    if (severity === 'critical') return '#ff3b30';
    if (severity === 'warning') return '#ff9500';
    return '#007AFF';
  };

  const getSeverityIcon = (severity, type) => {
    if (type === 'sos') return 'alert-circle';
    if (severity === 'critical') return 'alert-circle';
    if (severity === 'warning') return 'alert';
    return 'information-circle';
  };

  const renderItem = ({ item }) => {
    const color = getSeverityColor(item.severity, item.alert_type);
    const icon  = getSeverityIcon(item.severity, item.alert_type);

    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon} size={22} color={color} />
          </View>
          <View style={styles.cardMeta}>
            <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color }]}>
                {item.alert_type === 'sos' ? '🚨 SOS' : '📢 Announcement'}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        {item.target_city && (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#999" />
            <Text style={styles.locationText}>{item.target_city}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B0000" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.notification_id?.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B0000" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={60} color="#ddd" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>You'll see admin alerts and announcements here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton:  { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  list:        { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  cardMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  timeText:      { fontSize: 12, color: '#999' },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 6 },
  cardMessage:   { fontSize: 14, color: '#555', lineHeight: 20 },
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8, gap: 4,
  },
  locationText: { fontSize: 12, color: '#999' },
  empty:        { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle:   { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtitle:{ fontSize: 14, color: '#bbb', marginTop: 6, textAlign: 'center' },
});

export default NotificationsScreen;