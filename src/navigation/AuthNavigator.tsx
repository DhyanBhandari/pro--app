// Authentication flow navigator
// Handles login, register, and forgot password screens

/**
 * AuthNavigator - Phase 1
 * 
 * Stack navigator for authentication flow including login,
 * registration, and password recovery screens.
 * 
 * @screens Login, Register, ForgotPassword
 * @transitions Smooth glassmorphism-styled transitions
 * @headers Transparent headers with glassmorphism styling
 */

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { theme } from '@/themes';
import { AuthStackParamList } from '@/types';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  console.log('[AuthNavigator] Initializing authentication navigator');

  const screenOptions = {
    headerStyle: {
      ...theme.glassmorphism.navigation.header,
      height: 100,
    },
    headerTintColor: theme.colors.text.primary,
    headerTitleStyle: {
      ...theme.typography.styles.h4,
      color: theme.colors.text.primary,
    },
    headerTransparent: true,
    headerBackTitleVisible: false,
    cardStyle: {
      backgroundColor: theme.colors.background.primary,
    },
    ...TransitionPresets.SlideFromRightIOS,
  };

  const headerBackButton = (onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginLeft: 16,
        padding: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.glass.primary,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
      }}
    >
      <Ionicons 
        name="chevron-back" 
        size={24} 
        color={theme.colors.text.primary} 
      />
    </TouchableOpacity>
  );

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={screenOptions}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={({ navigation }) => ({
          title: 'Create Account',
          headerLeft: () => headerBackButton(() => navigation.goBack()),
        })}
      />
      
      <Stack.Screen
        name="ForgotPassword"
        component={LoginScreen} // Placeholder - will be implemented in future phases
        options={({ navigation }) => ({
          title: 'Reset Password',
          headerLeft: () => headerBackButton(() => navigation.goBack()),
        })}
      />
    </Stack.Navigator>
  );
};