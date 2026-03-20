// Mobile/AshaSetu/screens/VerifyOTPScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { apiConfig } from '../config/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;

  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer]       = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputs = useRef([]);
  const timerRef = useRef(null);

  // Countdown timer for resend
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleOtpChange = (value, index) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next box
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Backspace on empty box — go back to previous
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await response.json();

      if (data.success) {
        navigation.navigate('ResetPassword', { email });
      } else {
        Alert.alert('Invalid Code', data.message || 'Incorrect code. Please try again.');
        // Clear boxes on wrong code
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Code Sent', 'A new reset code has been sent to your email');
        // Reset timer
        setOtp(['', '', '', '', '', '']);
        setTimer(60);
        setCanResend(false);
        timerRef.current = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      Alert.alert('Error', 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

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
          <Text style={styles.topIcon}>📩</Text>
          <Text style={styles.topTitle}>Check Your Email</Text>
          <Text style={styles.topSubtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{maskedEmail}</Text>
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.bottomSection}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter Reset Code</Text>
            <Text style={styles.cardSubtitle}>
              Type the 6-digit code from your email
            </Text>

            {/* OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.verifyButtonText}>Verify Code</Text>
                  <Text style={styles.verifyArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive it? </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                  <Text style={styles.resendLink}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimer}>Resend in {timer}s</Text>
              )}
            </View>
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
  container:        { flex: 1, backgroundColor: '#8B0000' },
  scrollContent:    { flexGrow: 1, minHeight: SCREEN_HEIGHT },
  topSection:       { backgroundColor: '#8B0000', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backButton:       { position: 'absolute', top: 60, left: 20, padding: 8 },
  backArrow:        { fontSize: 24, color: '#fff' },
  topIcon:          { fontSize: 56, marginBottom: 16 },
  topTitle:         { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  topSubtitle:      { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  emailHighlight:   { color: '#FFD700', fontWeight: '600' },
  bottomSection:    { flex: 1, backgroundColor: '#d8dce0ff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  card:             { backgroundColor: '#8B0000', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  cardTitle:        { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  cardSubtitle:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24 },
  otpRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox:           { width: 44, height: 54, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  otpBoxFilled:     { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.15)' },
  verifyButton:     { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  buttonDisabled:   { backgroundColor: '#B8B8B8' },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  verifyArrow:      { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resendRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendLabel:      { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  resendLink:       { fontSize: 13, color: '#FFD700', fontWeight: '700' },
  resendTimer:      { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  backToLogin:      { marginTop: 24, alignItems: 'center' },
  backToLoginText:  { fontSize: 14, color: '#8B0000', fontWeight: '600' },
});

export default VerifyOTPScreen;