import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyVolunteerStatus, cancelVolunteerApplication } from '../api/volunteer';

const VolunteerStatusScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await getMyVolunteerStatus();
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = () => {
    Alert.alert(
      'Cancel Application',
      'Are you sure you want to cancel your volunteer application?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelVolunteerApplication();
              Alert.alert('Cancelled', 'Your application has been cancelled', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  const renderStatusContent = () => {
    switch (status?.status) {
      case 'pending':
        return (
          <>
            <View style={[styles.statusCard, styles.statusPending]}>
              <Ionicons name="time-outline" size={48} color="#ff9800" />
              <Text style={styles.statusTitle}>Application Pending</Text>
              <Text style={styles.statusMessage}>
                Your volunteer application is being reviewed by our admin team. 
                You'll be notified once a decision is made.
              </Text>
              <Text style={styles.statusDate}>
                Applied on {new Date(status.requested_at).toLocaleDateString()}
              </Text>
            </View>

            {status.application && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Your Application</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Skills:</Text>
                  <Text style={styles.detailValue}>
                    {status.application.skills?.join(', ')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{status.application.reason}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelApplication}
            >
              <Text style={styles.cancelButtonText}>Cancel Application</Text>
            </TouchableOpacity>
          </>
        );

      case 'approved':
        return (
          <View style={[styles.statusCard, styles.statusApproved]}>
            <Ionicons name="checkmark-circle" size={64} color="#4caf50" />
            <Text style={styles.statusTitle}>Volunteer Approved! 🎉</Text>
            <Text style={styles.statusMessage}>
              Congratulations! You are now an approved volunteer. 
              You can create events and campaigns to help the community.
            </Text>
            <Text style={styles.statusDate}>
              Approved on {new Date(status.approved_at).toLocaleDateString()}
            </Text>
          </View>
        );

      case 'rejected':
        return (
          <>
            <View style={[styles.statusCard, styles.statusRejected]}>
              <Ionicons name="close-circle" size={48} color="#f44336" />
              <Text style={styles.statusTitle}>Application Not Approved</Text>
              <Text style={styles.statusMessage}>
                Unfortunately, your volunteer application was not approved at this time.
              </Text>
              {status.rejection_reason && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>Reason:</Text>
                  <Text style={styles.reasonText}>{status.rejection_reason}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.reapplyButton}
              onPress={() => navigation.navigate('VolunteerApplication')}
            >
              <Text style={styles.reapplyButtonText}>Apply Again</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return (
          <View style={styles.noApplicationCard}>
            <Ionicons name="information-circle-outline" size={48} color="#999" />
            <Text style={styles.noApplicationText}>No application found</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {renderStatusContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  statusCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusPending: { borderLeftWidth: 4, borderLeftColor: '#ff9800' },
  statusApproved: { borderLeftWidth: 4, borderLeftColor: '#4caf50' },
  statusRejected: { borderLeftWidth: 4, borderLeftColor: '#f44336' },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  statusMessage: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  statusDate: { fontSize: 13, color: '#999' },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailsTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#333', lineHeight: 20 },
  reasonBox: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
  },
  reasonLabel: { fontSize: 14, fontWeight: '600', color: '#c62828', marginBottom: 4 },
  reasonText: { fontSize: 14, color: '#c62828' },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  reapplyButton: {
    backgroundColor: '#8B0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reapplyButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  noApplicationCard: {
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  noApplicationText: { fontSize: 16, color: '#999', marginTop: 12 },
});

export default VolunteerStatusScreen;