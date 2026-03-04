import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VerifyEmailScreen({ route }) {
  const success = route.params?.success === 'true';
  const message = route.params?.message || '';

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
      <Text style={styles.title}>{success ? 'Email Verified!' : 'Verification Failed'}</Text>
      <Text style={styles.sub}>{success ? 'You can now use all features of AshaSetu.' : message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  sub: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
});