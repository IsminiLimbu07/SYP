import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { apiConfig } from '../config/api';

const ConnectionDebugScreen = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, message) => {
    setResults(prev => [...prev, { test, status, message, time: new Date().toLocaleTimeString() }]);
  };

  const testConnections = async () => {
    setResults([]);
    setTesting(true);

    try {
      // Test 1: Backend health check
      addResult('Backend Health Check', 'testing', 'Checking if backend is running...');
      try {
        const response = await fetch('http://192.168.56.1:9000/', {
          timeout: 5000,
        });
        const data = await response.json();
        if (response.ok && data.message) {
          addResult('Backend Health Check', 'success', `✅ Backend is running: ${data.message}`);
        } else {
          addResult('Backend Health Check', 'error', '❌ Backend responded but with error');
        }
      } catch (error) {
        addResult('Backend Health Check', 'error', `❌ Cannot reach backend: ${error.message}`);
      }

      // Test 2: API configuration
      addResult('API Configuration', 'success', `✅ API Base URL: ${apiConfig.BASE_URL}`);

      // Test 3: Register endpoint
      addResult('Register Endpoint', 'testing', 'Testing registration endpoint...');
      try {
        const response = await fetch(apiConfig.ENDPOINTS.AUTH.REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: 'Test User',
            email: 'test@test.com',
            phone_number: '9800000000',
            password: 'test123'
          }),
          timeout: 5000,
        });
        const data = await response.json();
        if (response.ok) {
          addResult('Register Endpoint', 'success', `✅ Register endpoint works`);
        } else if (data.message) {
          addResult('Register Endpoint', 'success', `✅ Endpoint reachable: ${data.message}`);
        } else {
          addResult('Register Endpoint', 'error', '❌ Endpoint error');
        }
      } catch (error) {
        addResult('Register Endpoint', 'error', `❌ Cannot reach register: ${error.message}`);
      }

      // Test 4: Network info
      addResult('Network Check', 'info', '📱 Phone must be on same WiFi as backend');
      addResult('Network Check', 'info', '🌐 Backend IP: 192.168.56.1');
      addResult('Network Check', 'info', '🔌 Backend Port: 9000');

    } catch (error) {
      addResult('General Error', 'error', `Error during testing: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Connection Debug Tool</Text>
          <Text style={styles.subtitle}>Test backend connectivity</Text>
        </View>

        <TouchableOpacity
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          onPress={testConnections}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.testButtonText}>Testing...</Text>
            </>
          ) : (
            <Text style={styles.testButtonText}>Run Connection Test</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.length === 0 && !testing && (
            <Text style={styles.noResults}>Click "Run Connection Test" to begin</Text>
          )}
          {results.map((result, index) => (
            <View key={index} style={[styles.resultItem, styles[`result_${result.status}`]]}>
              <Text style={styles.resultTest}>{result.test}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTime}>{result.time}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Troubleshooting Tips:</Text>
          <Text style={styles.infoText}>
            1. Make sure your phone is connected to the SAME WiFi network as your computer
          </Text>
          <Text style={styles.infoText}>
            2. Check that backend is running: cd Backend && npm start
          </Text>
          <Text style={styles.infoText}>
            3. Verify IP address: Run 'ipconfig' on your computer
          </Text>
          <Text style={styles.infoText}>
            4. Disable firewall temporarily to test (Windows Defender)
          </Text>
          <Text style={styles.infoText}>
            5. Make sure port 9000 is not blocked
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
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  noResults: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  result_success: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  result_error: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  result_testing: {
    backgroundColor: '#FFF9C4',
    borderLeftColor: '#FBC02D',
  },
  result_info: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  resultTest: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultMessage: {
    color: '#555',
    fontSize: 14,
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ConnectionDebugScreen;
