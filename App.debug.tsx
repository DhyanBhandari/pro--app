// Debug version of App.tsx with simplified imports
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('[App] Debug version starting...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 Connect App - Debug Mode</Text>
      <Text style={styles.subtext}>If you see this, the app is working!</Text>
      <Text style={styles.info}>Phase 1 - Glassmorphism Design</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: '#00D4FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});