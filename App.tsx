// Main application entry point
// Configures navigation and global providers

/**
 * Connect App - Phase 1
 * 
 * A React Native Expo application with glassmorphism design system
 * featuring authentication flow, onboarding, and futuristic animations.
 * 
 * @author Developer
 * @version 1.0.0
 * @phase 1 - Foundation & Authentication UI
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  console.log('[App] Application starting...');
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0A0A0A" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}