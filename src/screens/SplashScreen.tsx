// Animated splash screen with glassmorphism branding
// Shows app logo and handles initial authentication check

/**
 * SplashScreen Component - Phase 1
 * 
 * Animated splash screen that displays the app logo with glassmorphism
 * effects while checking authentication state and transitioning to
 * the appropriate screen (onboarding, login, or main app).
 * 
 * @navigation Automatically navigates after authentication check
 * @animations Logo scale and fade animations
 * @timeout 2 second minimum display time
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { theme } from '@/themes';
import { authService, storageService } from '@/services';
import { RootStackParamList } from '@/types';
import { APP_CONFIG, TIMEOUTS, STORAGE_KEYS } from '@/utils';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  console.log('[SplashScreen] Component mounted');
  
  const navigation = useNavigation<SplashScreenNavigationProp>();
  
  // Animation values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Animation styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowIntensity.value,
  }));

  const initializeApp = async () => {
    console.log('[SplashScreen] Initializing application');
    
    try {
      // Start animations
      startAnimations();
      
      // Check authentication state
      const authState = await authService.checkAuthState();
      console.log('[SplashScreen] Auth state checked:', authState.isAuthenticated);
      
      // Check if onboarding was completed
      const onboardingCompleted = await storageService.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
      console.log('[SplashScreen] Onboarding completed:', onboardingCompleted);
      
      // Wait for minimum splash time
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.SPLASH_DELAY));
      
      // Navigate based on app state
      if (authState.isAuthenticated) {
        console.log('[SplashScreen] User authenticated, navigating to Main');
        navigation.replace('Main');
      } else if (onboardingCompleted) {
        console.log('[SplashScreen] Onboarding completed, navigating to Auth');
        navigation.replace('Auth', { screen: 'Login' });
      } else {
        console.log('[SplashScreen] First time user, navigating to Onboarding');
        navigation.replace('Onboarding', { screen: 'Welcome' });
      }
    } catch (error) {
      console.error('[SplashScreen] Initialization error:', error);
      // On error, default to onboarding
      navigation.replace('Onboarding', { screen: 'Welcome' });
    }
  };

  const startAnimations = () => {
    console.log('[SplashScreen] Starting animations');
    
    // Logo animation sequence
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600, easing: theme.animations.easing.elastic }),
      withTiming(1, { duration: 400, easing: theme.animations.easing.glass })
    );
    
    logoOpacity.value = withTiming(1, { duration: 800, easing: theme.animations.easing.easeOut });
    
    // Title animation with delay
    titleOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: theme.animations.easing.easeOut })
    );
    
    // Subtitle animation with longer delay
    subtitleOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 600, easing: theme.animations.easing.easeOut })
    );
    
    // Glow effect animation
    glowIntensity.value = withDelay(
      600,
      withSequence(
        withTiming(0.6, { duration: 800, easing: theme.animations.easing.easeOut }),
        withTiming(0.3, { duration: 1000, easing: theme.animations.easing.easeInOut })
      )
    );
  };

  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={theme.colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Animated content */}
      <View style={styles.content}>
        {/* Logo container with glow */}
        <Animated.View style={[styles.logoContainer, glowAnimatedStyle]}>
          <Animated.View style={[styles.logo, logoAnimatedStyle]}>
            {/* Glassmorphism logo placeholder */}
            <View style={[styles.logoShape, theme.glassmorphism.card.elevated]}>
              <LinearGradient
                colors={[theme.colors.neon.blue, theme.colors.neon.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>C</Text>
              </LinearGradient>
            </View>
          </Animated.View>
        </Animated.View>
        
        {/* App title */}
        <Animated.View style={titleAnimatedStyle}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
        </Animated.View>
        
        {/* App subtitle */}
        <Animated.View style={subtitleAnimatedStyle}>
          <Text style={styles.subtitle}>
            Connect with anything, anyone, anywhere
          </Text>
        </Animated.View>
        
        {/* Version info */}
        <View style={styles.versionContainer}>
          <Text style={styles.version}>
            v{APP_CONFIG.VERSION} • Phase {APP_CONFIG.PHASE}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: theme.colors.neon.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 15,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShape: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...theme.typography.styles.h1,
    fontSize: 64,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textShadowColor: theme.colors.background.primary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    ...theme.typography.styles.h1,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: theme.colors.neon.blue,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  version: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});