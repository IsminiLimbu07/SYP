// Mobile/AshaSetu/screens/ForgotPasswordScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { apiConfig } from '../config/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        // Always navigate forward — backend never reveals if email exists
        navigation.navigate('VerifyOTP', { email: email.trim().toLowerCase() });
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.topIcon}>🔐</Text>
          <Text style={styles.topTitle}>Forgot Password</Text>
          <Text style={styles.topSubtitle}>
            Enter your registered email and we'll send you a 6-digit reset code
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.bottomSection}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reset Your Password</Text>
            <Text style={styles.cardSubtitle}>
              We'll send a 6-digit code to your email. It expires in 15 minutes.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
                <Text style={styles.inputIcon}>✉</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.sendButtonText}>Send Reset Code</Text>
                  <Text style={styles.sendArrow}>→</Text>
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
  container:      { flex: 1, backgroundColor: '#8B0000' },
  scrollContent:  { flexGrow: 1, minHeight: SCREEN_HEIGHT },
  topSection:     { backgroundColor: '#8B0000', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backButton:     { position: 'absolute', top: 60, left: 20, padding: 8 },
  backArrow:      { fontSize: 24, color: '#fff' },
  topIcon:        { fontSize: 56, marginBottom: 16 },
  topTitle:       { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  topSubtitle:    { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  bottomSection:  { flex: 1, backgroundColor: '#d8dce0ff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  card:           { backgroundColor: '#8B0000', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  cardTitle:      { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  cardSubtitle:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24, lineHeight: 19 },
  inputGroup:     { marginBottom: 20 },
  label:          { fontSize: 13, color: '#fff', marginBottom: 8, fontWeight: '500' },
  inputWrapper:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 12 },
  input:          { flex: 1, paddingVertical: 13, fontSize: 14, color: '#fff' },
  inputIcon:      { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginLeft: 8 },
  sendButton:     { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#B8B8B8' },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  sendArrow:      { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backToLogin:    { marginTop: 24, alignItems: 'center' },
  backToLoginText:{ fontSize: 14, color: '#8B0000', fontWeight: '600' },
});

export default ForgotPasswordScreen;