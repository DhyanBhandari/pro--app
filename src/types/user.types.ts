// User-related type definitions
// Defines user data structures and authentication states

/**
 * User Type Definitions - Phase 1
 * 
 * TypeScript interfaces and types for user data, authentication
 * states, and user-related operations.
 * 
 * @interface User - Core user data structure
 * @interface AuthState - Authentication state management
 * @interface LoginCredentials - Login form data
 * @interface RegisterData - Registration form data
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  biometricAuth: boolean;
}