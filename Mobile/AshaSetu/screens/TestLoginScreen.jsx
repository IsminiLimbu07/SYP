import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { apiConfig } from '../config/api';

const TestLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('test123@test.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, { message, type, timestamp }]);
  };

  const testLogin = async () => {
    setLog([]);
    setLoading(true);
    addLog('Starting login test...', 'info');

    try {
      addLog(`API URL: ${apiConfig.ENDPOINTS.AUTH.LOGIN}`, 'info');
      addLog('Sending login request...', 'info');

      const response = await fetch(apiConfig.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      addLog(`Response Status: ${response.status}`, response.ok ? 'success' : 'error');

      const data = await response.json();
      addLog(`Response Data: ${JSON.stringify(data, null, 2)}`, response.ok ? 'success' : 'error');

      if (response.ok && data.success) {
        addLog('✅ Login successful!', 'success');
        Alert.alert('Success', 'Login worked! Check console for details.');
      } else {
        addLog(`❌ ${data.message}`, 'error');
        Alert.alert('Failed', data.message || 'Login failed');
      }
    } catch (error) {
      addLog(`❌ Network Error: ${error.message}`, 'error');
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>🧪 Test Login</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Testing...' : 'Test Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>📋 Test Log:</Text>
          {log.map((item, index) => (
            <View key={index} style={[styles.logItem, styles[`log_${item.type}`]]}>
              <Text style={styles.logTime}>{item.timestamp}</Text>
              <Text style={styles.logMessage}>{item.message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Configuration:</Text>
          <Text style={styles.infoText}>API Base: {apiConfig.BASE_URL}</Text>
          <Text style={styles.infoText}>
            Login Endpoint: {apiConfig.ENDPOINTS.AUTH.LOGIN}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
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
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  logItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 4,
  },
  log_info: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  log_success: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  log_error: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  logTime: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 13,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#FFF9E5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default TestLoginScreen;
