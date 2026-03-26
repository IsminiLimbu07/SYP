// Mobile/AshaSetu/screens/NotificationsScreen.jsx
import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

const NPT = 'Asia/Kathmandu';

const parseUTC = (str) => {
  if (!str) return new Date();
  const s = typeof str === 'string' ? str : str.toISOString();
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z');
};

const formatTime = (dateStr) => {
  const date = parseUTC(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMs < 60000) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;

  const dateDay = date.toLocaleDateString('en-US', { timeZone: NPT, year: 'numeric', month: '2-digit', day: '2-digit' });
  const today   = now.toLocaleDateString('en-US',  { timeZone: NPT, year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = date.toLocaleTimeString('en-US', { timeZone: NPT, hour: 'numeric', minute: '2-digit', hour12: true });

  if (dateDay === today) return timeStr;

  const dateLabel = date.toLocaleDateString('en-US', { timeZone: NPT, month: 'short', day: 'numeric' });
  return `${dateLabel}, ${timeStr}`;
};
   
const NotificationsScreen = ({ navigation }) => {
  const { token, setUnreadCount } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setNotifications(data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${apiConfig.BASE_URL}/notifications/mark-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (typeof setUnreadCount === 'function') setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications().then(() => {
        markAllAsRead();
        setUnreadCount(0);
      });
    }, [token])
  );

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
    if (type === 'sos') return 'alert-circle-outline';
    if (severity === 'critical') return 'alert-circle-outline';
    if (severity === 'warning') return 'alert-outline';
    return 'information-outline';
  };

  const openInMaps = async (lat, lng, label = '') => {
    if (lat == null || lng == null) return;
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

    const coordinate = `${latitude},${longitude}`;
    let url = '';

    if (Platform.OS === 'ios') {
      const q = label ? `${label}@${coordinate}` : coordinate;
      url = `maps:0,0?q=${encodeURIComponent(q)}`;
    } else {
      const q = label ? `${coordinate}(${label})` : coordinate;
      url = `geo:0,0?q=${encodeURIComponent(q)}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const browserUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinate)}`;
        await Linking.openURL(browserUrl);
      }
    } catch (e) {
      console.error('Error opening maps:', e);
    }
  };

  const renderItem = ({ item }) => {
    const color    = getSeverityColor(item.severity, item.alert_type);
    const icon     = getSeverityIcon(item.severity, item.alert_type);
    const isUnread = !item.is_read;

    // Show the safe location block only when all 3 fields are present
    const hasSafeLocation =
      item.alert_type === 'sos' &&
      item.safe_location_lat != null &&
      item.safe_location_lng != null &&
      item.safe_location_label;

    return (
      <View style={[styles.card, { borderLeftColor: color }, isUnread && styles.cardUnread]}>
        {/* ── Header ── */}
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
            <View style={styles.timeRow}>
              {isUnread && <View style={styles.unreadDot} />}
              <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* ── Content ── */}
        <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.cardMessage}>{item.message}</Text>

        {/* ── Target city ── */}
        {item.target_city && (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#999" />
            <Text style={styles.metaText}>{item.target_city}</Text>
          </View>
        )}

        {/* ── Safe Location button (SOS only) ── */}
        {hasSafeLocation && (
          <TouchableOpacity
            style={styles.safeLocationBtn}
            onPress={() => openInMaps(
              item.safe_location_lat,
              item.safe_location_lng,
              item.safe_location_label
            )}
            activeOpacity={0.8}
          >
            <View style={styles.safeLocationLeft}>
              <MaterialCommunityIcons name="map-marker-check" size={18} color="#ff3b30" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.safeLocationTitle}>Safe Location</Text>
                <Text style={styles.safeLocationLabel}>{item.safe_location_label}</Text>
              </View>
            </View>
            <View style={styles.openMapsChip}>
              <MaterialCommunityIcons name="directions" size={14} color="#fff" />
              <Text style={styles.openMapsText}>Open in Maps</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.emptySubtitle}>
                You'll see admin alerts and announcements here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list:      { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, borderLeftWidth: 4, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardUnread: { backgroundColor: '#fffaf0' },

  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  iconCircle:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardMeta:    { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },

  timeRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8B0000' },
  timeText:  { fontSize: 12, color: '#999' },

  cardTitle:      { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 6 },
  cardTitleUnread: { fontWeight: '800' },
  cardMessage:    { fontSize: 14, color: '#555', lineHeight: 20 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  metaText: { fontSize: 12, color: '#999' },

  // ── Safe location button ───────────────────────────────────────────────────
  safeLocationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, backgroundColor: '#fff5f5', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#ffcdd2', padding: 12,
  },
  safeLocationLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  safeLocationTitle: { fontSize: 11, fontWeight: '700', color: '#ff3b30', letterSpacing: 0.5 },
  safeLocationLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 2 },

  openMapsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ff3b30', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginLeft: 10,
  },
  openMapsText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  empty:         { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle:    { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#bbb', marginTop: 6, textAlign: 'center' },
});

export default NotificationsScreen;