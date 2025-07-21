// Root navigation system
// Manages app-wide navigation flow and screen transitions

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
import { View, Text, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { SplashScreen, OnboardingScreen, HomeScreen } from '@/screens'; // ✅ Import HomeScreen
import { AuthNavigator } from './AuthNavigator';
import { theme } from '@/themes';
import { RootStackParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();

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
          options={{ animationEnabled: false }}
        />

        {/* Onboarding Flow */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ ...TransitionPresets.SlideFromRightIOS }}
        />

        {/* Authentication Flow */}
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ ...TransitionPresets.SlideFromRightIOS }}
        />

        {/* Home Screen (Main App) */}
        <Stack.Screen
          name="Main"
          component={HomeScreen}
          options={{
            ...TransitionPresets.FadeFromBottomAndroid,
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
