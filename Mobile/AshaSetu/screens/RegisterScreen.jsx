// frontend/src/screens/RegisterScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { registerUser } from '../api/auth';

const RegisterScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    district: '',
    phone_number: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.full_name || !formData.email || !formData.phone_number || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { district, ...registerData } = formData;
      const response = await registerUser(registerData);

      if (response.success) {
        await login(response.token, response.user);
        Alert.alert('Success', 'Registration successful!');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>❤️</Text>
          </View>
          <Text style={styles.mainTitle}>Join AashaSetu</Text>
          <Text style={styles.subtitle}>Be a lifesaver today</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(139, 0, 0, 0.4)"
                value={formData.full_name}
                onChangeText={(value) => updateField('full_name', value)}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="rgba(139, 0, 0, 0.4)"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* District */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.input}
                placeholder="Your district"
                placeholderTextColor="rgba(139, 0, 0, 0.4)"
                value={formData.district}
                onChangeText={(value) => updateField('district', value)}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="98XXXXXXXX"
                placeholderTextColor="rgba(139, 0, 0, 0.4)"
                value={formData.phone_number}
                onChangeText={(value) => updateField('phone_number', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor="rgba(139, 0, 0, 0.4)"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              By signing up, you agree to help save lives and be part of our community.
            </Text>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.createButtonText}>Create Account</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 25
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4
  },
  iconText: {
    fontSize: 35
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 5,
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 16,
    color: '#A0522D',
    fontStyle: 'italic'
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#8B0000',
    marginBottom: 8,
    fontWeight: '600'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#F0D0D0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 4
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5E6',
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center'
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#8B6F47',
    lineHeight: 18
  },
  createButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  createButtonDisabled: {
    backgroundColor: '#B8B8B8'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8
  },
  buttonArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10
  },
  signInText: {
    fontSize: 15,
    color: '#666'
  },
  signInLink: {
    fontSize: 15,
    color: '#8B0000',
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  },
  bottomSpacing: {
    height: 20
  }
});

export default RegisterScreen;