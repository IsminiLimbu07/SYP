// frontend/src/screens/ChangePasswordScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import Icon from 'react-native-vector-icons/Ionicons';

const ChangePasswordScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    current_password: '',  // Fixed: Changed from old_password to current_password
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Check current password
    if (!formData.current_password.trim()) {
      newErrors.current_password = 'Current password is required';
    }

    // Check new password
    if (!formData.new_password.trim()) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'Password must be at least 6 characters';
    }

    // Check if passwords match
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Check if new password is different from current
    if (formData.current_password && formData.new_password && 
        formData.current_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
const handleChangePassword = async () => {
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  try {
    // Send only current_password and new_password to backend
    const passwordData = {
      current_password: formData.current_password,
      new_password: formData.new_password
    };

    // 🔍 DEBUG: Log exactly what we're sending
    console.log('🔍 Sending to backend:', JSON.stringify(passwordData, null, 2));
    console.log('🔍 Token being used:', token ? 'Token exists' : 'No token');

    const response = await changePassword(token, passwordData);

    if (response.success) {
      Alert.alert(
        '✅ Success',
        'Password changed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                current_password: '',
                new_password: '',
                confirm_password: ''
              });
              navigation.goBack();
            }
          }
        ]
      );
    }
  } catch (error) {
    console.error('❌ Change password error:', error);
    Alert.alert('❌ Error', error.message || 'Password change failed');
  } finally {
    setLoading(false);
  }
};
  
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="lock-closed" size={50} color="#8B0000" />
          <Text style={styles.headerTitle}>Change Password</Text>
          <Text style={styles.headerSubtitle}>Update your account password</Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="information-circle" size={20} color="#8B0000" />
          <Text style={styles.infoText}>
            Password must be at least 6 characters long and should be hard to guess
          </Text>
        </View>

        {/* Current Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <View style={[styles.passwordContainer, errors.current_password && styles.inputError]}>
            <Icon name="key" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter current password"
              placeholderTextColor="#999"
              value={formData.current_password}
              onChangeText={(value) => updateField('current_password', value)}
              secureTextEntry={!showCurrentPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <Icon 
                name={showCurrentPassword ? 'eye-off' : 'eye'} 
                size={22} 
                color="#8B0000" 
              />
            </TouchableOpacity>
          </View>
          {errors.current_password && (
            <Text style={styles.errorText}>{errors.current_password}</Text>
          )}
        </View>

        {/* New Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={[styles.passwordContainer, errors.new_password && styles.inputError]}>
            <Icon name="lock-closed" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              value={formData.new_password}
              onChangeText={(value) => updateField('new_password', value)}
              secureTextEntry={!showNewPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <Icon 
                name={showNewPassword ? 'eye-off' : 'eye'} 
                size={22} 
                color="#8B0000" 
              />
            </TouchableOpacity>
          </View>
          {errors.new_password && (
            <Text style={styles.errorText}>{errors.new_password}</Text>
          )}
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={[styles.passwordContainer, errors.confirm_password && styles.inputError]}>
            <Icon name="checkmark-circle" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              value={formData.confirm_password}
              onChangeText={(value) => updateField('confirm_password', value)}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Icon 
                name={showConfirmPassword ? 'eye-off' : 'eye'} 
                size={22} 
                color="#8B0000" 
              />
            </TouchableOpacity>
          </View>
          {errors.confirm_password && (
            <Text style={styles.errorText}>{errors.confirm_password}</Text>
          )}
        </View>

        {/* Password Requirements Checklist */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password must:</Text>
          <View style={styles.requirementItem}>
            <Icon 
              name={formData.new_password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'} 
              size={18} 
              color={formData.new_password.length >= 6 ? '#4CAF50' : '#999'} 
            />
            <Text style={styles.requirementText}>Be at least 6 characters</Text>
          </View>
          <View style={styles.requirementItem}>
            <Icon 
              name={formData.new_password === formData.confirm_password && formData.new_password ? 'checkmark-circle' : 'ellipse-outline'} 
              size={18} 
              color={formData.new_password === formData.confirm_password && formData.new_password ? '#4CAF50' : '#999'} 
            />
            <Text style={styles.requirementText}>Match confirmation</Text>
          </View>
          <View style={styles.requirementItem}>
            <Icon 
              name={formData.current_password && formData.new_password && formData.current_password !== formData.new_password ? 'checkmark-circle' : 'ellipse-outline'} 
              size={18} 
              color={formData.current_password && formData.new_password && formData.current_password !== formData.new_password ? '#4CAF50' : '#999'} 
            />
            <Text style={styles.requirementText}>Be different from current</Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="shield-checkmark" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Icon name="close" size={20} color="#666" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
    marginTop: 10
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  infoBox: {
    backgroundColor: '#fce8e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoText: {
    color: '#8B0000',
    fontSize: 13,
    marginLeft: 10,
    flex: 1
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    height: 50
  },
  inputIcon: {
    paddingHorizontal: 10
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  inputError: {
    borderColor: '#ff3b30',
    borderWidth: 1.5
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5
  },
  requirementsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8
  },
  button: {
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  buttonDisabled: {
    backgroundColor: '#d3a0a0',
    shadowOpacity: 0.1
  },
  buttonIcon: {
    marginRight: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5
  }
});

export default ChangePasswordScreen;