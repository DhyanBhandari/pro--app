// Login screen with glassmorphism form
// Handles user authentication with animated form elements

/**
 * LoginScreen Component - Phase 1
 * 
 * Authentication screen with glassmorphism design featuring
 * animated form inputs, validation, and smooth transitions.
 * 
 * @form Email and password inputs with validation
 * @actions Login, forgot password, and social login (UI only)
 * @navigation Handles successful login navigation
 * @mockAuth Uses test@example.com / Test123! for testing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { GlassCard, NeonButton, AnimatedInput, LoadingOverlay } from '@/components';
import { theme } from '@/themes';
import { authService, validationService } from '@/services';
import { AuthStackParamList, LoginCredentials } from '@/types';
import { stringHelpers } from '@/utils';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  console.log('[LoginScreen] Component mounted');
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  // Form state
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

  // Animation styles
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  React.useEffect(() => {
    console.log('[LoginScreen] Starting entrance animations');
    formOpacity.value = withTiming(1, { duration: theme.animations.timing.slow });
    formTranslateY.value = withTiming(0, { duration: theme.animations.timing.slow });
  }, []);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    console.log('[LoginScreen] Input change:', field);
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    console.log('[LoginScreen] Validating form');
    const validation = validationService.validateLoginForm(credentials.email, credentials.password);
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message;
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleLogin = async () => {
    console.log('[LoginScreen] Login attempt');
    
    if (!validateForm()) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        console.log('[LoginScreen] Login successful');
        Alert.alert(
          'Welcome Back!',
          `Hello ${response.user?.name || 'User'}! Login successful.`,
          [{ text: 'Continue', onPress: () => navigation.replace('Main' as any) }]
        );
      } else {
        console.log('[LoginScreen] Login failed:', response.error);
        Alert.alert('Login Failed', response.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('[LoginScreen] Forgot password pressed');
    navigation.navigate('ForgotPassword', { email: credentials.email });
  };

  const handleSocialLogin = (provider: string) => {
    console.log('[LoginScreen] Social login attempted:', provider);
    Alert.alert(
      'Social Login',
      `${stringHelpers.capitalize(provider)} login will be implemented in a future phase.`,
      [{ text: 'OK' }]
    );
  };

  const navigateToRegister = () => {
    console.log('[LoginScreen] Navigate to register');
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={theme.colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, formAnimatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your journey
            </Text>
          </View>

          {/* Login Form */}
          <GlassCard style={styles.formCard} variant="elevated">
            <View style={styles.form}>
              <AnimatedInput
                label="Email"
                value={credentials.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                error={errors.email}
                placeholder="Enter your email"
              />

              <AnimatedInput
                label="Password"
                value={credentials.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                error={errors.password}
                placeholder="Enter your password"
              />

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Animated.View style={buttonAnimatedStyle}>
                <NeonButton
                  title="Sign In"
                  onPress={handleLogin}
                  variant="primary"
                  loading={isLoading}
                  style={styles.loginButton}
                />
              </Animated.View>
            </View>
          </GlassCard>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, theme.glassmorphism.button.primary]}
                onPress={() => handleSocialLogin('google')}
              >
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, theme.glassmorphism.button.primary]}
                onPress={() => handleSocialLogin('facebook')}
              >
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Credentials */}
          <GlassCard style={styles.demoCard} variant="secondary">
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <Text style={styles.demoText}>Email: test@example.com</Text>
            <Text style={styles.demoText}>Password: Test123!</Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>

      <LoadingOverlay 
        visible={isLoading} 
        message="Signing you in..." 
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...theme.typography.styles.h1,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 30,
  },
  form: {
    gap: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    ...theme.typography.styles.caption,
    color: theme.colors.neon.blue,
  },
  loginButton: {
    marginTop: 10,
  },
  socialSection: {
    marginBottom: 30,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.glass.border,
  },
  dividerText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.tertiary,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.text.primary,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  registerLink: {
    ...theme.typography.styles.body,
    color: theme.colors.neon.blue,
    fontWeight: '600',
  },
  demoCard: {
    alignItems: 'center',
  },
  demoTitle: {
    ...theme.typography.styles.caption,
    color: theme.colors.neon.green,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoText: {
    ...theme.typography.styles.small,
    color: theme.colors.text.tertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});