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
});

export default SendNotificationScreen;