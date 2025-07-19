// Authentication service with mock implementation
// Handles login, registration, and auth state management

/**
 * Authentication Service - Phase 1
 * 
 * Mock authentication service for Phase 1 development.
 * Simulates real authentication with local storage persistence.
 * 
 * @method login - Authenticate user with credentials
 * @method register - Create new user account
 * @method logout - Clear authentication state
 * @method getCurrentUser - Get current authenticated user
 * @method checkAuthState - Verify existing authentication
 */

import { User, AuthResponse, LoginCredentials, RegisterData, AuthState } from '@/types';
import { storageService } from './StorageService';
import { validationService } from './ValidationService';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const AUTH_STATE_KEY = 'auth_state';

// Mock user database
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890',
    avatar: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVerified: true,
  },
];

export class AuthService {
  private static instance: AuthService;
  private authStateListeners: Array<(state: AuthState) => void> = [];

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthService] Login attempt for:', credentials.email);
    
    try {
      // Simulate network delay
      await this.delay(1500);

      // Validate input
      const validation = validationService.validateLoginForm(credentials.email, credentials.password);
      if (!validation.isValid) {
        console.log('[AuthService] Login validation failed:', validation.errors);
        return {
          success: false,
          error: validation.errors[0].message,
        };
      }

      // Mock authentication - allow test@example.com with password Test123!
      if (credentials.email === 'test@example.com' && credentials.password === 'Test123!') {
        const user = MOCK_USERS[0];
        const token = this.generateMockToken();

        // Store auth data
        await storageService.setItem(AUTH_TOKEN_KEY, token);
        await storageService.setItem(USER_DATA_KEY, user);

        console.log('[AuthService] Login successful for:', user.email);
        
        // Notify listeners
        this.notifyAuthStateChange({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
          error: null,
        });

        return {
          success: true,
          user,
          token,
          message: 'Login successful',
        };
      }

      console.log('[AuthService] Login failed - invalid credentials');
      return {
        success: false,
        error: 'Invalid email or password',
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('[AuthService] Registration attempt for:', data.email);
    
    try {
      // Simulate network delay
      await this.delay(2000);

      // Validate input
      const validation = validationService.validateRegisterForm(data);
      if (!validation.isValid) {
        console.log('[AuthService] Registration validation failed:', validation.errors);
        return {
          success: false,
          error: validation.errors[0].message,
        };
      }

      // Check if user already exists (mock check)
      const existingUser = MOCK_USERS.find(user => user.email === data.email);
      if (existingUser) {
        console.log('[AuthService] Registration failed - user exists');
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        phone: data.phone,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: false,
      };

      const token = this.generateMockToken();

      // Store auth data
      await storageService.setItem(AUTH_TOKEN_KEY, token);
      await storageService.setItem(USER_DATA_KEY, newUser);

      // Add to mock database
      MOCK_USERS.push(newUser);

      console.log('[AuthService] Registration successful for:', newUser.email);
      
      // Notify listeners
      this.notifyAuthStateChange({
        isAuthenticated: true,
        user: newUser,
        token,
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        user: newUser,
        token,
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('[AuthService] Registration error:', error);
      return {
        success: false,
        error: 'An error occurred during registration',
      };
    }
  }

  async logout(): Promise<boolean> {
    console.log('[AuthService] Logout initiated');
    
    try {
      // Clear stored auth data
      await storageService.removeItem(AUTH_TOKEN_KEY);
      await storageService.removeItem(USER_DATA_KEY);
      await storageService.removeItem(AUTH_STATE_KEY);

      // Notify listeners
      this.notifyAuthStateChange({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });

      console.log('[AuthService] Logout successful');
      return true;
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('[AuthService] Getting current user');
    
    try {
      const user = await storageService.getItem<User>(USER_DATA_KEY);
      const token = await storageService.getItem<string>(AUTH_TOKEN_KEY);

      if (user && token) {
        console.log('[AuthService] Current user found:', user.email);
        return user;
      }

      console.log('[AuthService] No current user found');
      return null;
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return null;
    }
  }

  async checkAuthState(): Promise<AuthState> {
    console.log('[AuthService] Checking authentication state');
    
    try {
      const user = await storageService.getItem<User>(USER_DATA_KEY);
      const token = await storageService.getItem<string>(AUTH_TOKEN_KEY);

      const authState: AuthState = {
        isAuthenticated: !!(user && token),
        user: user || null,
        token: token || null,
        isLoading: false,
        error: null,
      };

      console.log('[AuthService] Auth state checked:', authState.isAuthenticated);
      return authState;
    } catch (error) {
      console.error('[AuthService] Error checking auth state:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: 'Failed to check authentication state',
      };
    }
  }

  subscribeToAuthState(listener: (state: AuthState) => void): () => void {
    console.log('[AuthService] Adding auth state listener');
    this.authStateListeners.push(listener);

    // Return unsubscribe function
    return () => {
      console.log('[AuthService] Removing auth state listener');
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  private notifyAuthStateChange(state: AuthState): void {
    console.log('[AuthService] Notifying auth state change to', this.authStateListeners.length, 'listeners');
    this.authStateListeners.forEach(listener => listener(state));
  }

  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method for development
  async clearAllAuthData(): Promise<void> {
    console.log('[AuthService] Clearing all auth data');
    await storageService.removeItem(AUTH_TOKEN_KEY);
    await storageService.removeItem(USER_DATA_KEY);
    await storageService.removeItem(AUTH_STATE_KEY);
  }
}

export const authService = AuthService.getInstance();