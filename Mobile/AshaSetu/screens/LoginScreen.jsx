// frontend/src/screens/LoginScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../api/auth';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Starting login...', { email });
      const response = await loginUser({ email, password });
      console.log('✅ Login response:', response);
      if (response.success) {
        console.log('🔄 Saving to AuthContext...');
        await login(response.token, response.user);
        console.log('🎉 Login successful!');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Full error:', error.toString());
      Alert.alert('Login Failed', error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Section with Logo - Beige Background */}
      <View style={styles.topSection}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          {/* Logo Image */}
          <Image
            source={require('../assets/images/Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom Section with Form - Gradient Background */}
      <View style={styles.bottomSection}>
        {/* Welcome Card with Embedded Form */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>WELCOME</Text>
          <Text style={styles.welcomeSubtitle}>Hello, Login Back To Your Account</Text>
          
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="placeholder"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.inputIcon}>✉</Text>
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="placeholder"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Text style={styles.inputIcon}>👁</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forget Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Login</Text>
                <Text style={styles.loginArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>SignUp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3'
  },
  topSection: {
    flex: 0.4,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40
  },
  logoContainer: {
    alignItems: 'center'
  },
  logoImage: {
    width: 600,
    height: 500
  },
  bottomSection: {
    flex: 0.8,
    backgroundColor: '#E8C5C5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,

  },
  welcomeCard: {
    backgroundColor: '#8B0000',
    marginHorizontal: 20,
    marginTop: -5,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center'
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 25
  },
  inputGroup: {
    marginBottom: 18
  },
  label: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff'
  },
  inputIcon: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 8
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 20
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500'
  },
  loginButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5
  },
  loginButtonDisabled: {
    backgroundColor: '#B8B8B8'
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8
  },
  loginArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 20
  },
  registerText: {
    fontSize: 14,
    color: '#5C0000'
  },
  registerLink: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  }
});

export default LoginScreen;