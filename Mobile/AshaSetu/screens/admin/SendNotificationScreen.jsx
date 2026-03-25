

// Mobile/AshaSetu/screens/admin/SendNotificationScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { apiConfig } from '../../config/api';

const SendNotificationScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const [loading,          setLoading]          = useState(false);
  const [notificationType, setNotificationType] = useState('sos');
  const [title,            setTitle]            = useState('');
  const [message,          setMessage]          = useState('');
  const [severity,         setSeverity]         = useState('critical');
  const [targetAll,        setTargetAll]        = useState(true);
  const [targetCity,       setTargetCity]       = useState('');

  // ── Safe location (SOS only) ───────────────────────────────────────────────
  const [includeSafeLocation, setIncludeSafeLocation] = useState(false);
  const [safeLocationLabel,   setSafeLocationLabel]   = useState('');
  const [safeLocationLat,     setSafeLocationLat]     = useState('');
  const [safeLocationLng,     setSafeLocationLng]     = useState('');

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a notification title.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Missing Field', 'Please enter a notification message.');
      return;
    }
    if (!targetAll && !targetCity.trim()) {
      Alert.alert('Missing Field', 'Please enter a city name for targeted notifications.');
      return;
    }

    // Validate safe location fields if toggled on
    if (notificationType === 'sos' && includeSafeLocation) {
      if (!safeLocationLabel.trim()) {
        Alert.alert('Missing Field', 'Please enter a label for the safe location (e.g. "Janakpur City Hall").');
        return;
      }
      const lat = parseFloat(safeLocationLat);
      const lng = parseFloat(safeLocationLng);
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude numbers.');
        return;
      }
      if (lat < -90 || lat > 90) {
        Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90.');
        return;
      }
      if (lng < -180 || lng > 180) {
        Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180.');
        return;
      }
    }

    setLoading(true);
    try {
      const body = {
        title:       title.trim(),
        message:     message.trim(),
        alert_type:  notificationType,
        severity:    notificationType === 'sos' ? severity : 'info',
        target_all:  targetAll,
        target_city: targetAll ? null : targetCity.trim(),
      };

      // Only attach safe location for SOS alerts when toggled on
      if (notificationType === 'sos' && includeSafeLocation) {
        body.safe_location_lat   = parseFloat(safeLocationLat);
        body.safe_location_lng   = parseFloat(safeLocationLng);
        body.safe_location_label = safeLocationLabel.trim();
      }

      const response = await fetch(`${apiConfig.BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          '✅ Sent!',
          `${notificationType === 'sos' ? 'SOS alert' : 'Announcement'} broadcast successfully.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Failed', data.message || 'Could not send notification.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = notificationType === 'sos' ? '#ff3b30' : '#007AFF';
  const hasSafeLocation = notificationType === 'sos' && includeSafeLocation &&
    safeLocationLabel.trim() && safeLocationLat && safeLocationLng;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Type Selector ── */}
          <Text style={styles.label}>NOTIFICATION TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeCard, notificationType === 'sos' && styles.typeCardActive]}
              onPress={() => setNotificationType('sos')}
              activeOpacity={0.8}
            >
              <Text style={styles.typeEmoji}>🚨</Text>
              <Text style={[styles.typeTitle, notificationType === 'sos' && { color: '#8B0000' }]}>
                SOS Alert
              </Text>
              <Text style={styles.typeSubtitle}>Critical emergency</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, notificationType === 'general' && styles.typeCardActive]}
              onPress={() => { setNotificationType('general'); setIncludeSafeLocation(false); }}
              activeOpacity={0.8}
            >
              <Text style={styles.typeEmoji}>📢</Text>
              <Text style={[styles.typeTitle, notificationType === 'general' && { color: '#8B0000' }]}>
                Announcement
              </Text>
              <Text style={styles.typeSubtitle}>General update</Text>
            </TouchableOpacity>
          </View>

          {/* ── Title ── */}
          <Text style={styles.label}>TITLE *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title..."
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />

          {/* ── Message ── */}
          <Text style={styles.label}>MESSAGE *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your message here..."
            placeholderTextColor="#bbb"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{message.length} / 1000</Text>

          {/* ── Severity (SOS only) ── */}
          {notificationType === 'sos' && (
            <>
              <Text style={styles.label}>SEVERITY</Text>
              <View style={styles.severityRow}>
                {[
                  { value: 'critical', emoji: '🔴', label: 'Critical', color: '#ff3b30' },
                  { value: 'warning',  emoji: '🟠', label: 'Warning',  color: '#ff9500' },
                  { value: 'info',     emoji: '🔵', label: 'Info',     color: '#007AFF' },
                ].map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={[
                      styles.severityBtn,
                      { borderColor: s.color },
                      severity === s.value && { backgroundColor: s.color + '25' },
                    ]}
                    onPress={() => setSeverity(s.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.severityEmoji}>{s.emoji}</Text>
                    <Text style={[
                      styles.severityLabel,
                      severity === s.value && { color: s.color, fontWeight: '700' },
                    ]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Safe Location (SOS only) ───────────────────────────────────── */}
          {notificationType === 'sos' && (
            <>
              <Text style={styles.label}>SAFE LOCATION</Text>
              <View style={styles.toggleCard}>
                <View style={styles.toggleLeft}>
                  <MaterialCommunityIcons name="map-marker-check" size={22} color="#ff3b30" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.toggleTitle}>Include Safe Location</Text>
                    <Text style={styles.toggleSub}>Users can tap to open in Maps</Text>
                  </View>
                </View>
                <Switch
                  value={includeSafeLocation}
                  onValueChange={setIncludeSafeLocation}
                  trackColor={{ false: '#e0e0e0', true: '#ffb3b0' }}
                  thumbColor={includeSafeLocation ? '#ff3b30' : '#fff'}
                />
              </View>

              {includeSafeLocation && (
                <View style={styles.locationFields}>
                  {/* Label */}
                  <Text style={styles.fieldLabel}>Place Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder='e.g. "Janakpur City Hall" or "Dharahara Square"'
                    placeholderTextColor="#bbb"
                    value={safeLocationLabel}
                    onChangeText={setSafeLocationLabel}
                    maxLength={100}
                  />

                  {/* Coordinates row */}
                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Coordinates *</Text>
                  <Text style={styles.coordHint}>
                    💡 Open Google Maps, long-press the location, and copy the numbers shown at the top.
                  </Text>
                  <View style={styles.coordRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.coordLabel}>Latitude</Text>
                      <TextInput
                        style={[styles.input, styles.coordInput]}
                        placeholder="e.g. 26.7271"
                        placeholderTextColor="#bbb"
                        value={safeLocationLat}
                        onChangeText={setSafeLocationLat}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.coordLabel}>Longitude</Text>
                      <TextInput
                        style={[styles.input, styles.coordInput]}
                        placeholder="e.g. 85.9240"
                        placeholderTextColor="#bbb"
                        value={safeLocationLng}
                        onChangeText={setSafeLocationLng}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── Target Audience ── */}
          <Text style={styles.label}>TARGET AUDIENCE</Text>

          <TouchableOpacity
            style={[styles.radioCard, targetAll && styles.radioCardActive]}
            onPress={() => setTargetAll(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, targetAll && styles.radioActive]}>
              {targetAll && <View style={styles.radioDot} />}
            </View>
            <View>
              <Text style={styles.radioTitle}>🌍 All Users</Text>
              <Text style={styles.radioSub}>Broadcast to everyone in the app</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioCard, !targetAll && styles.radioCardActive]}
            onPress={() => setTargetAll(false)}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, !targetAll && styles.radioActive]}>
              {!targetAll && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioTitle}>📍 Specific City</Text>
              <Text style={styles.radioSub}>Target users in a specific location</Text>
            </View>
          </TouchableOpacity>

          {!targetAll && (
            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="Enter city name (e.g., Kathmandu, Pokhara)..."
              placeholderTextColor="#bbb"
              value={targetCity}
              onChangeText={setTargetCity}
              maxLength={50}
            />
          )}

          {/* ── Live Preview ── */}
          <Text style={styles.label}>PREVIEW</Text>
          <View style={[styles.previewCard, { borderLeftColor: accentColor }]}>
            <Text style={[styles.previewBadge, { color: accentColor }]}>
              {notificationType === 'sos' ? '🚨 EMERGENCY ALERT' : '📢 ANNOUNCEMENT'}
            </Text>
            <Text style={styles.previewTitle}>
              {title.trim() || 'Notification Title'}
            </Text>
            <Text style={styles.previewMsg}>
              {message.trim() || 'Your message will appear here...'}
            </Text>
            {hasSafeLocation && (
              <View style={styles.previewLocation}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#ff3b30" />
                <Text style={styles.previewLocationText}>
                  Safe Location: {safeLocationLabel}
                </Text>
              </View>
            )}
            <Text style={styles.previewMeta}>
              To: {targetAll ? 'All Users' : (targetCity || 'Selected City')}
            </Text>
          </View>

          {/* ── Send Button ── */}
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>
                  {notificationType === 'sos' ? '🚨  Send SOS Alert' : '📢  Send Notification'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  scrollContent: { padding: 16 },

  label: {
    fontSize: 11, fontWeight: '700', color: '#8B0000',
    letterSpacing: 1, marginTop: 22, marginBottom: 10,
  },

  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e8e8e8',
  },
  typeCardActive: { borderColor: '#8B0000', backgroundColor: '#fff5f5' },
  typeEmoji:    { fontSize: 30, marginBottom: 8 },
  typeTitle:    { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 3 },
  typeSubtitle: { fontSize: 11, color: '#aaa', textAlign: 'center' },

  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#222',
  },
  textArea:  { minHeight: 110, textAlignVertical: 'top', paddingTop: 14 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 5 },

  severityRow: { flexDirection: 'row', gap: 10 },
  severityBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 2, paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  severityEmoji: { fontSize: 18 },
  severityLabel: { fontSize: 12, fontWeight: '600', color: '#555' },

  // ── Safe location ──────────────────────────────────────────────────────────
  toggleCard: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ffe0de', padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  toggleSub:   { fontSize: 12, color: '#888', marginTop: 2 },

  locationFields: {
    backgroundColor: '#fff9f9', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#ffe0de', padding: 14, marginTop: 10,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8 },
  coordHint:  { fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 18 },
  coordRow:   { flexDirection: 'row' },
  coordLabel: { fontSize: 11, color: '#888', marginBottom: 6, fontWeight: '600' },
  coordInput: { paddingVertical: 10, fontSize: 14 },

  // ── Target audience ────────────────────────────────────────────────────────
  radioCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 2, borderColor: '#e8e8e8',
  },
  radioCardActive: { borderColor: '#8B0000', backgroundColor: '#fff5f5' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#ccc', alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: '#8B0000' },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8B0000' },
  radioTitle:  { fontSize: 15, fontWeight: '600', color: '#222' },
  radioSub:    { fontSize: 12, color: '#888', marginTop: 2 },

  // ── Preview ────────────────────────────────────────────────────────────────
  previewCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  previewBadge:        { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  previewTitle:        { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 6 },
  previewMsg:          { fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 10 },
  previewLocation:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  previewLocationText: { fontSize: 13, color: '#ff3b30', fontWeight: '600' },
  previewMeta:         { fontSize: 12, color: '#aaa' },

  // ── Send / Cancel ──────────────────────────────────────────────────────────
  sendBtn: {
    backgroundColor: '#8B0000', borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
    shadowColor: '#8B0000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  sendBtnDisabled: { backgroundColor: '#c08080', elevation: 0, shadowOpacity: 0 },
  sendBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  cancelBtn:       { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText:   { color: '#999', fontSize: 15, fontWeight: '500' },
});

export default SendNotificationScreen;
