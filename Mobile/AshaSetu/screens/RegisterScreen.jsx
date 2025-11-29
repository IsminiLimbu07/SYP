// Mobile/AshaSetu/screens/RegisterScreen.jsx
// FIXED: No more ref.measureLayout errors

import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Keyboard
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { registerUser } from '../api/auth';

const RegisterScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const scrollViewRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    district: '',
    phone_number: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleRegister = async () => {
    if (!formData.full_name || !formData.email || !formData.phone_number || !formData.password) {
      Alert.alert('Required Fields Missing', 'Please fill in all required fields to continue.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    const phoneRegex = /^98\d{8}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      Alert.alert('Invalid Phone Number', 'Phone number must start with 98 and be 10 digits long.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { district, ...registerData } = formData;
      const response = await registerUser(registerData);

      if (response.success) {
        await login(response.token, response.user);
        Alert.alert('Success', 'Your account has been created successfully!');
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Simple scroll function with fixed positions
  const scrollToField = (scrollY) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: scrollY,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerDecoration} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join AshaSetu to help save lives</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'full_name' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={formData.full_name}
                onChangeText={(value) => updateField('full_name', value)}
                onFocus={() => {
                  setFocusedField('full_name');
                  scrollToField(0);
                }}
                onBlur={() => setFocusedField(null)}
                autoComplete="name"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                onFocus={() => {
                  setFocusedField('email');
                  scrollToField(80);
                }}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'phone' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#999"
                value={formData.phone_number}
                onChangeText={(value) => updateField('phone_number', value)}
                onFocus={() => {
                  setFocusedField('phone');
                  scrollToField(180);
                }}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={10}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.hint}>Format: 98XXXXXXXX (10 digits)</Text>
          </View>

          {/* District */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>District (Optional)</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'district' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Your district"
                placeholderTextColor="#999"
                value={formData.district}
                onChangeText={(value) => updateField('district', value)}
                onFocus={() => {
                  setFocusedField('district');
                  scrollToField(300);
                }}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'password' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                onFocus={() => {
                  setFocusedField('password');
                  scrollToField(400);
                }}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '○' : '●'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Must be at least 6 characters</Text>
          </View>

          {/* Terms Notice */}
          <View style={styles.termsContainer}>
            <View style={styles.termsDivider} />
            <Text style={styles.termsText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Extra space at bottom for keyboard */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    backgroundColor: '#8B0000',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerDecoration: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#8B0000',
    shadowColor: '#8B0000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '400',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    padding: 8,
    position: 'absolute',
    right: 12,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#8B0000',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 6,
    fontStyle: 'italic',
  },
  termsContainer: {
    marginTop: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  termsDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#E1E8ED',
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  registerButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 54,
  },
  registerButtonDisabled: {
    backgroundColor: '#B8B8B8',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    color: '#7F8C8D',
    fontWeight: '400',
  },
  loginLink: {
    fontSize: 15,
    color: '#8B0000',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomSpacing: {
    height: 250,
  }
});

export default RegisterScreen;