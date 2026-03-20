// Mobile/AshaSetu/screens/ResetPasswordScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { apiConfig } from '../config/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email } = route.params;

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Password Reset! 🎉',
          'Your password has been updated. Please log in with your new password.',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simple password strength indicator
  const getStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Too short', color: '#FF5252' };
    if (pw.length < 8) return { label: 'Weak', color: '#FF9800' };
    if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { label: 'Strong', color: '#4CAF50' };
    return { label: 'Medium', color: '#FFC107' };
  };

  const strength = getStrength(newPassword);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" translucent={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Header */}
        <View style={styles.topSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topIcon}>🔑</Text>
          <Text style={styles.topTitle}>New Password</Text>
          <Text style={styles.topSubtitle}>
            Choose a strong password you haven't used before
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.bottomSection}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set New Password</Text>
            <Text style={styles.cardSubtitle}>
              Resetting password for{' '}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeButton}>
                  <Text style={styles.inputIcon}>{showNew ? '👁' : '🔒'}</Text>
                </TouchableOpacity>
              </View>
              {/* Strength indicator */}
              {strength && (
                <View style={styles.strengthRow}>
                  <View style={[styles.strengthBar, { backgroundColor: strength.color, width: `${newPassword.length >= 6 ? (newPassword.length >= 8 ? (/[A-Z]/.test(newPassword) && /\d/.test(newPassword) ? 100 : 66) : 33) : 15}%` }]} />
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[
                styles.inputWrapper,
                confirmPassword && newPassword !== confirmPassword && styles.inputWrapperError,
                confirmPassword && newPassword === confirmPassword && styles.inputWrapperSuccess,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                  <Text style={styles.inputIcon}>{showConfirm ? '👁' : '🔒'}</Text>
                </TouchableOpacity>
              </View>
              {confirmPassword && newPassword !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <Text style={styles.successText}>✓ Passwords match</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                  <Text style={styles.resetArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#8B0000' },
  scrollContent:       { flexGrow: 1, minHeight: SCREEN_HEIGHT },
  topSection:          { backgroundColor: '#8B0000', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backButton:          { position: 'absolute', top: 60, left: 20, padding: 8 },
  backArrow:           { fontSize: 24, color: '#fff' },
  topIcon:             { fontSize: 56, marginBottom: 16 },
  topTitle:            { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  topSubtitle:         { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  bottomSection:       { flex: 1, backgroundColor: '#d8dce0ff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  card:                { backgroundColor: '#8B0000', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  cardTitle:           { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  cardSubtitle:        { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24, lineHeight: 19 },
  emailHighlight:      { color: '#FFD700', fontWeight: '600' },
  inputGroup:          { marginBottom: 18 },
  label:               { fontSize: 13, color: '#fff', marginBottom: 8, fontWeight: '500' },
  inputWrapper:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 12 },
  inputWrapperError:   { borderWidth: 1.5, borderColor: '#FF5252' },
  inputWrapperSuccess: { borderWidth: 1.5, borderColor: '#4CAF50' },
  input:               { flex: 1, paddingVertical: 13, fontSize: 14, color: '#fff' },
  inputIcon:           { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginLeft: 8 },
  eyeButton:           { padding: 5 },
  strengthRow:         { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  strengthBar:         { height: 4, borderRadius: 2, backgroundColor: '#4CAF50' },
  strengthLabel:       { fontSize: 11, fontWeight: '600' },
  errorText:           { fontSize: 11, color: '#FF5252', marginTop: 5 },
  successText:         { fontSize: 11, color: '#4CAF50', marginTop: 5 },
  resetButton:         { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled:      { backgroundColor: '#B8B8B8' },
  resetButtonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  resetArrow:          { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backToLogin:         { marginTop: 24, alignItems: 'center' },
  backToLoginText:     { fontSize: 14, color: '#8B0000', fontWeight: '600' },
});

export default ResetPasswordScreen;