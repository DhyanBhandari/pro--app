// Registration screen with comprehensive form validation
// Handles new user account creation with animated form

/**
 * RegisterScreen Component - Phase 1
 * 
 * User registration screen with comprehensive form validation,
 * password strength indicator, and terms acceptance.
 * 
 * @form Name, email, phone, password, confirm password inputs
 * @validation Real-time form validation with error messages
 * @features Password strength indicator, terms checkbox
 * @navigation Handles successful registration flow
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
  Switch,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { GlassCard, NeonButton, AnimatedInput, LoadingOverlay } from '@/components';
import { theme } from '@/themes';
import { authService, validationService } from '@/services';
import { AuthStackParamList, RegisterData } from '@/types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const { width, height } = Dimensions.get('window');

export const RegisterScreen: React.FC = () => {
  console.log('[RegisterScreen] Component mounted');
  
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  // Form state
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const passwordStrength = useSharedValue(0);

  // Animation styles
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const strengthBarStyle = useAnimatedStyle(() => {
    const colors = [
      theme.colors.status.error,
      theme.colors.status.warning,
      theme.colors.neon.blue,
      theme.colors.status.success,
    ];
    
    const colorIndex = Math.min(Math.floor(passwordStrength.value), colors.length - 1);
    const backgroundColor = interpolateColor(
      passwordStrength.value,
      [0, 1, 2, 3, 4],
      [
        theme.colors.glass.border,
        theme.colors.status.error,
        theme.colors.status.warning,
        theme.colors.neon.blue,
        theme.colors.status.success,
      ]
    );

    return {
      backgroundColor,
      width: `${(passwordStrength.value / 4) * 100}%`,
    };
  });

  React.useEffect(() => {
    console.log('[RegisterScreen] Starting entrance animations');
    formOpacity.value = withTiming(1, { duration: theme.animations.timing.slow });
    formTranslateY.value = withTiming(0, { duration: theme.animations.timing.slow });
  }, []);

  const handleInputChange = (field: keyof RegisterData, value: string | boolean) => {
    console.log('[RegisterScreen] Input change:', field);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Update password strength indicator
    if (field === 'password' && typeof value === 'string') {
      const strength = validationService.validatePasswordStrength(value);
      passwordStrength.value = withTiming(strength.strength, { 
        duration: theme.animations.timing.fast 
      });
    }
  };

  const validateForm = (): boolean => {
    console.log('[RegisterScreen] Validating form');
    const validation = validationService.validateRegisterForm(formData);
    
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

  const handleRegister = async () => {
    console.log('[RegisterScreen] Registration attempt');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.register(formData);
      
      if (response.success) {
        console.log('[RegisterScreen] Registration successful');
        Alert.alert(
          'Welcome!',
          `Account created successfully! Welcome ${response.user?.name}!`,
          [{ text: 'Get Started', onPress: () => navigation.replace('Main' as any) }]
        );
      } else {
        console.log('[RegisterScreen] Registration failed:', response.error);
        Alert.alert('Registration Failed', response.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('[RegisterScreen] Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    console.log('[RegisterScreen] Navigate to login');
    navigation.navigate('Login');
  };

  const getPasswordStrengthLabel = (): string => {
    const strength = validationService.validatePasswordStrength(formData.password);
    return strength.label;
  };

  const getPasswordStrengthColor = (): string => {
    const strengthValue = validationService.validatePasswordStrength(formData.password).strength;
    const colors = [
      theme.colors.status.error,
      theme.colors.status.error,
      theme.colors.status.warning,
      theme.colors.neon.blue,
      theme.colors.status.success,
    ];
    return colors[strengthValue] || theme.colors.glass.border;
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join us and start connecting
            </Text>
          </View>

          {/* Registration Form */}
          <GlassCard style={styles.formCard} variant="elevated">
            <View style={styles.form}>
              <AnimatedInput
                label="Full Name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                error={errors.name}
                placeholder="Enter your full name"
              />

              <AnimatedInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                error={errors.email}
                placeholder="Enter your email"
              />

              <AnimatedInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                error={errors.phone}
                placeholder="Enter your phone number"
              />

              <View>
                <AnimatedInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry
                  error={errors.password}
                  placeholder="Create a password"
                />
                
                {/* Password Strength Indicator */}
                {formData.password.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={styles.strengthBarContainer}>
                      <Animated.View style={[styles.strengthBar, strengthBarStyle]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: getPasswordStrengthColor() }]}>
                      {getPasswordStrengthLabel()}
                    </Text>
                  </View>
                )}
              </View>

              <AnimatedInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                error={errors.confirmPassword}
                placeholder="Confirm your password"
              />

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <View style={styles.termsRow}>
                  <Switch
                    value={formData.acceptTerms}
                    onValueChange={(value) => handleInputChange('acceptTerms', value)}
                    trackColor={{
                      false: theme.colors.glass.border,
                      true: theme.colors.neon.blue,
                    }}
                    thumbColor={
                      formData.acceptTerms 
                        ? theme.colors.text.primary 
                        : theme.colors.text.tertiary
                    }
                  />
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text style={styles.termsLink}>Terms of Service</Text>
                      {' '}and{' '}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </View>
                </View>
                {errors.acceptTerms && (
                  <Text style={styles.termsError}>{errors.acceptTerms}</Text>
                )}
              </View>

              <NeonButton
                title="Create Account"
                onPress={handleRegister}
                variant="primary"
                loading={isLoading}
                style={styles.registerButton}
              />
            </View>
          </GlassCard>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <LoadingOverlay 
        visible={isLoading} 
        message="Creating your account..." 
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
  passwordStrength: {
    marginTop: 8,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: theme.colors.glass.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    ...theme.typography.styles.small,
    textAlign: 'right',
  },
  termsContainer: {
    marginTop: 10,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  termsText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.neon.blue,
    fontWeight: '600',
  },
  termsError: {
    ...theme.typography.styles.caption,
    color: theme.colors.status.error,
    marginTop: 4,
    marginLeft: 44,
  },
  registerButton: {
    marginTop: 10,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    ...theme.typography.styles.body,
    color: theme.colors.neon.blue,
    fontWeight: '600',
  },
});