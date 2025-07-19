// Application constants
// Centralized configuration and constant values

/**
 * Application Constants - Phase 1
 * 
 * Centralized constants for the application including
 * configuration values, timeouts, and static strings.
 * 
 * @category Config - Application configuration
 * @category UI - User interface constants
 * @category API - API-related constants
 */

export const APP_CONFIG = {
  NAME: 'Connect App',
  VERSION: '1.0.0',
  PHASE: 1,
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
} as const;

export const TIMEOUTS = {
  SPLASH_DELAY: 2000,
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  API_REQUEST: 10000,
  DEBOUNCE: 300,
} as const;

export const SCREEN_NAMES = {
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  MAIN: 'Main',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  APP_PREFERENCES: 'app_preferences',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  EMAIL_MAX_LENGTH: 254,
} as const;

export const UI_CONSTANTS = {
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    EXTRA_LARGE: 20,
    CARD: 20,
    BUTTON: 12,
  },
  SPACING: {
    EXTRA_SMALL: 4,
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    EXTRA_LARGE: 32,
    SECTION: 40,
  },
  OPACITY: {
    DISABLED: 0.5,
    OVERLAY: 0.8,
    GLASS: 0.1,
    PRESSED: 0.7,
  },
} as const;

export const ONBOARDING_SCREENS = [
  {
    id: 1,
    title: 'Connect with anything, anyone, anywhere',
    subtitle: 'Break down barriers and connect seamlessly across all platforms and devices.',
    image: 'onboarding_1',
  },
  {
    id: 2,
    title: 'AI-powered matching in seconds',
    subtitle: 'Our intelligent system finds the perfect connections for your needs instantly.',
    image: 'onboarding_2',
  },
  {
    id: 3,
    title: 'Your universal connection platform',
    subtitle: 'One app, infinite possibilities. Welcome to the future of connectivity.',
    image: 'onboarding_3',
  },
] as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  PERMISSION_ERROR: 'Permission denied. Please check your settings.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back! Login successful.',
  REGISTER_SUCCESS: 'Account created successfully! Welcome aboard.',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  PASSWORD_RESET: 'Password reset link sent to your email.',
} as const;

export const HAPTIC_PATTERNS = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;