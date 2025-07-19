// Root navigation system
// Manages app-wide navigation flow and screen transitions

/**
 * RootNavigator - Phase 1
 * 
 * Main navigation coordinator that handles the overall app flow
 * including splash, onboarding, authentication, and main app screens.
 * 
 * @flow Splash -> Onboarding -> Auth -> Main
 * @theme Custom glassmorphism navigation theme
 * @transitions Smooth screen transitions with shared elements
 */

import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { theme } from '@/themes';
import { RootStackParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();

// Custom navigation theme with glassmorphism colors
const NavigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.neon.blue,
    background: theme.colors.background.primary,
    card: theme.colors.glass.primary,
    text: theme.colors.text.primary,
    border: theme.colors.glass.border,
    notification: theme.colors.neon.pink,
  },
};

// Placeholder Main Screen for Phase 1
const MainScreen: React.FC = () => {
  console.log('[MainScreen] Placeholder main screen rendered');
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
      padding: 40,
    }}>
      <View style={{
        ...theme.glassmorphism.card.elevated,
        padding: 40,
        alignItems: 'center',
      }}>
        <Text style={{ 
          ...theme.typography.styles.h2,
          color: theme.colors.text.primary,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          🎉 Welcome to Connect App!
        </Text>
        <Text style={{ 
          ...theme.typography.styles.body,
          color: theme.colors.text.secondary,
          marginBottom: 20,
          textAlign: 'center',
          lineHeight: 24,
        }}>
          Phase 1 Complete! You've successfully logged in.{'\n'}
          Main app features will be implemented in future phases.
        </Text>
        <View style={{
          padding: 12,
          backgroundColor: theme.colors.glass.secondary,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.glass.border,
        }}>
          <Text style={{ 
            ...theme.typography.styles.caption,
            color: theme.colors.neon.green,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          }}>
            Phase 1: Foundation & Authentication ✅
          </Text>
        </View>
      </View>
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  console.log('[RootNavigator] Initializing root navigation');

  return (
    <NavigationContainer theme={NavigationTheme}>
      <StatusBar style="light" backgroundColor={theme.colors.background.primary} />
      
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          ...TransitionPresets.FadeFromBottomAndroid,
        }}
      >
        {/* Splash Screen */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{
            animationEnabled: false,
          }}
        />

        {/* Onboarding Flow */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            ...TransitionPresets.SlideFromRightIOS,
          }}
        />

        {/* Authentication Flow */}
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            ...TransitionPresets.SlideFromRightIOS,
          }}
        />

        {/* Main App (Placeholder for Phase 1) */}
        <Stack.Screen
          name="Main"
          component={MainScreen as any}
          options={{
            ...TransitionPresets.FadeFromBottomAndroid,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};