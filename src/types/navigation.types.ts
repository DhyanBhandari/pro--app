// Navigation type definitions
// Defines route parameters and navigation stack types

/**
 * Navigation Type Definitions - Phase 1
 * 
 * TypeScript interfaces for React Navigation stack parameters
 * and route definitions. Ensures type safety for navigation.
 * 
 * @type RootStackParamList - Main navigation stack
 * @type AuthStackParamList - Authentication flow stack
 * @type OnboardingStackParamList - Onboarding flow stack
 */

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: undefined; // Will be expanded in future phases
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string };
  ResetPassword: { token: string };
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Features: undefined;
  GetStarted: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Search: undefined;
  Matching: { query: string; location?: string };
  MatchResults: { intentId: string };
  MatchDetails: { matchId: string; match: any };
  Profile: undefined;
  Settings: undefined;
  // More screens will be added in future phases
};

export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}

export interface ScreenOptions {
  headerShown?: boolean;
  headerTransparent?: boolean;
  headerTitle?: string;
  headerTitleStyle?: object;
  headerStyle?: object;
  cardStyle?: object;
  animationEnabled?: boolean;
}

export type NavigationDirection = 'horizontal' | 'vertical';
export type TransitionPreset = 'default' | 'modal' | 'card' | 'none';