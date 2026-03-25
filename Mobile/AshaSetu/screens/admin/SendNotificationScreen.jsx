// Mobile/AshaSetu/screens/admin/SendNotificationScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { apiConfig, makeRequest } from '../../config/api';

const SendNotificationScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState('general'); // 'general' or 'sos'
  const [severity, setSeverity] = useState('info'); // 'info', 'warning', 'critical'
  const [targetAll, setTargetAll] = useState(true);
  const [targetCity, setTargetCity] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [loading, setLoading] = useState(false);

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


  const handleSendNotification = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Message is required');
      return;
    }
    if (!targetAll && !targetCity.trim()) {
      Alert.alert('Error', 'City is required when targeting specific cities');
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

      const payload = {
        title: title.trim(),
        message: message.trim(),
        alert_type: alertType,
        severity: severity,
        target_all: targetAll,
        target_city: targetCity.trim() || null,
        send_push: sendPush,
      };

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


      console.log('📤 Sending notification:', payload);

      const response = await makeRequest(
        `${apiConfig.BASE_URL}/notifications`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      console.log('✅ Response:', response);

      if (response.success) {
        Alert.alert(
          'Success',
          `Notification sent successfully!\n\n${
            response.pushStats
              ? `Push notifications: ${response.pushStats.sent}/${response.pushStats.total} sent`
              : 'Saved to database'
          }`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setTitle('');
                setMessage('');
                setTargetCity('');
                setSeverity('info');
                setAlertType('general');
                setTargetAll(true);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title *</Text>
=======
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
            placeholder="Notification title (max 100 chars)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!loading}
            placeholderTextColor="#999"
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notification message (max 500 chars)"
            value={message}
            onChangeText={setMessage}
            maxLength={500}
            editable={!loading}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>

        {/* Alert Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Alert Type</Text>
          <View style={styles.typeButtonGroup}>
            {['general', 'sos'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  alertType === type && styles.typeButtonActive,
                ]}
                onPress={() => setAlertType(type)}
              >
                <MaterialCommunityIcons
                  name={type === 'sos' ? 'alert-circle' : 'information-outline'}
                  size={18}
                  color={alertType === type ? '#fff' : '#8B0000'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    alertType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type === 'sos' ? '🚨 SOS' : '📢 General'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* Severity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Severity Level</Text>
          <View style={styles.severityButtonGroup}>
            {['info', 'warning', 'critical'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  severity === level && styles.severityButtonActive,
                ]}
                onPress={() => setSeverity(level)}
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    severity === level && styles.severityButtonTextActive,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
=======
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


        {/* Target All / Target City */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionLabel}>Send to All Users</Text>
            <Switch
              value={targetAll}
              onValueChange={setTargetAll}
              disabled={loading}
              trackColor={{ false: '#ddd', true: '#8B0000' }}
            />
          </View>

          {!targetAll && (
            <TextInput
              style={styles.input}
              placeholder="Target city (e.g., Kathmandu)"
              value={targetCity}
              onChangeText={setTargetCity}
              editable={!loading}
              placeholderTextColor="#999"
            />
          )}
        </View>

        {/* Send Push Notifications */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionLabel}>Send Push Notifications</Text>
            <Switch
              value={sendPush}
              onValueChange={setSendPush}
              disabled={loading}
              trackColor={{ false: '#ddd', true: '#8B0000' }}
            />
          </View>
          <Text style={styles.helperText}>
            {sendPush
              ? '✅ Users will receive push notifications on their devices'
              : '⚠️ Notification will only be saved (no push)'}
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSendNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color="#0066cc"
          />
          <Text style={styles.infoText}>
            Push notifications will appear in users' system notification tray and
            in the app Notifications tab.
          </Text>
        </View>
=======
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
        <View style={styles.spacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  typeButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#8B0000',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#8B0000',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B0000',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  severityButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  severityButtonActive: {
    borderColor: '#8B0000',
    backgroundColor: '#8B0000',
  },
  severityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  severityButtonTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 18,
  },
  spacing: {
    height: 20,
  },
=======
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