// Enhanced Authentication Service for Phase 2
// Supports both mock and real API authentication

/**
 * Authentication Service V2 - Phase 2
 * 
 * Enhanced authentication service that can work with:
 * - FastAPI backend (production mode)
 * - Mock data (development mode)
 * - Automatic fallback between modes
 * 
 * Features:
 * - Real backend authentication via ApiService
 * - Fallback to mock authentication for development
 * - Seamless mode switching
 * - Enhanced error handling
 */

import { User, AuthResponse, LoginCredentials, RegisterData, AuthState } from '@/types';
import { storageService } from './StorageService';
import { validationService } from './ValidationService';
import { apiService } from './ApiService';
import { firebaseAuth, FirebaseUser } from '@/config/firebase';
import { supabaseService } from './SupabaseService';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const AUTH_MODE_KEY = 'auth_mode';

type AuthMode = 'firebase' | 'api' | 'mock';

// Mock user database (for development/testing) - Empty by default
const MOCK_USERS: User[] = [];

export class AuthServiceV2 {
  private static instance: AuthServiceV2;
  private authStateListeners: Array<(state: AuthState) => void> = [];
  private currentMode: AuthMode = 'firebase'; // Default to Firebase mode
  private firebaseUnsubscribe: (() => void) | null = null;

  public static getInstance(): AuthServiceV2 {
    if (!AuthServiceV2.instance) {
      AuthServiceV2.instance = new AuthServiceV2();
    }
    return AuthServiceV2.instance;
  }

  async initialize(): Promise<void> {
    console.log('[AuthServiceV2] Initializing...');
    
    // Check stored auth mode preference
    const storedMode = await storageService.getItem<AuthMode>(AUTH_MODE_KEY);
    if (storedMode) {
      this.currentMode = storedMode;
    }

    // Set up Firebase auth state listener if in Firebase mode
    if (this.currentMode === 'firebase') {
      this.setupFirebaseAuthListener();
    }

    // Test API connection to determine available mode
    if (this.currentMode === 'api') {
      const apiConnected = await apiService.checkConnection();
      if (!apiConnected) {
        console.log('[AuthServiceV2] API not available, switching to Firebase mode');
        this.currentMode = 'firebase';
        this.setupFirebaseAuthListener();
      }
    }

    console.log('[AuthServiceV2] Initialized in', this.currentMode, 'mode');
  }

  async setAuthMode(mode: AuthMode): Promise<void> {
    console.log('[AuthServiceV2] Switching to', mode, 'mode');
    
    // Clean up previous Firebase listener if switching away from Firebase
    if (this.currentMode === 'firebase' && mode !== 'firebase' && this.firebaseUnsubscribe) {
      this.firebaseUnsubscribe();
      this.firebaseUnsubscribe = null;
    }
    
    this.currentMode = mode;
    await storageService.setItem(AUTH_MODE_KEY, mode);
    
    // Set up Firebase listener if switching to Firebase
    if (mode === 'firebase') {
      this.setupFirebaseAuthListener();
    }
  }

  getAuthMode(): AuthMode {
    return this.currentMode;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Login attempt for:', credentials.email, 'in', this.currentMode, 'mode');
    
    try {
      // Validate input first
      const validation = validationService.validateLoginForm(credentials.email, credentials.password);
      if (!validation.isValid) {
        console.log('[AuthServiceV2] Login validation failed:', validation.errors);
        return {
          success: false,
          error: validation.errors[0].message,
        };
      }

      let response: AuthResponse;

      if (this.currentMode === 'firebase') {
        // Use Firebase authentication
        response = await this.loginWithFirebase(credentials);
      } else if (this.currentMode === 'api') {
        // Try API authentication first
        response = await this.loginWithAPI(credentials);
        
        // If API fails, try fallback to Firebase
        if (!response.success) {
          console.log('[AuthServiceV2] API login failed, trying Firebase fallback');
          response = await this.loginWithFirebase(credentials);
        }
      } else {
        // Use mock authentication
        response = await this.loginWithMock(credentials);
      }

      if (response.success && response.user && response.token) {
        // Store auth data
        await storageService.setItem(AUTH_TOKEN_KEY, response.token);
        await storageService.setItem(USER_DATA_KEY, response.user);

        console.log('[AuthServiceV2] Login successful for:', response.user.email);
        
        // Notify listeners
        this.notifyAuthStateChange({
          isAuthenticated: true,
          user: response.user,
          token: response.token,
          isLoading: false,
          error: null,
        });
      }

      return response;
    } catch (error) {
      console.error('[AuthServiceV2] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during login',
      };
    }
  }

  private async loginWithFirebase(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Attempting Firebase login');
    
    try {
      const { signInWithEmailAndPassword, getIdToken } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        credentials.email,
        credentials.password
      );
      
      const firebaseUser = userCredential.user;
      const token = await getIdToken(firebaseUser);
      
      // Convert Firebase user to our User type
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || 'User',
        phone: firebaseUser.phoneNumber || '',
        avatar: firebaseUser.photoURL,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: firebaseUser.emailVerified,
      };

      console.log('[AuthServiceV2] Firebase login successful');
      return {
        success: true,
        user,
        token,
        message: 'Firebase login successful',
      };
    } catch (error: any) {
      console.error('[AuthServiceV2] Firebase login error:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error),
      };
    }
  }

  private async loginWithAPI(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Attempting API login');
    
    try {
      const response = await apiService.login(credentials);
      console.log('[AuthServiceV2] API login result:', response.success);
      return response;
    } catch (error) {
      console.error('[AuthServiceV2] API login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API login failed',
      };
    }
  }

  private async loginWithMock(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Attempting mock login');
    
    // Simulate network delay
    await this.delay(1000);

    // Mock authentication - only allow registered users
    const existingUser = MOCK_USERS.find(
      user => user.email === credentials.email
    );

    if (!existingUser) {
      return {
        success: false,
        error: 'No account found with this email address',
      };
    }

    // In a real scenario, you'd verify password hash
    // For mock, we'll assume password is correct if user exists
    const token = this.generateMockToken();

    console.log('[AuthServiceV2] Mock login successful for:', existingUser.email);
    return {
      success: true,
      user: existingUser,
      token,
      message: 'Mock login successful',
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Registration attempt for:', data.email, 'in', this.currentMode, 'mode');
    
    try {
      // Validate input first
      const validation = validationService.validateRegisterForm(data);
      if (!validation.isValid) {
        console.log('[AuthServiceV2] Registration validation failed:', validation.errors);
        return {
          success: false,
          error: validation.errors[0].message,
        };
      }

      let response: AuthResponse;

      if (this.currentMode === 'firebase') {
        // Use Firebase registration
        response = await this.registerWithFirebase(data);
      } else if (this.currentMode === 'api') {
        // Try API registration first
        response = await this.registerWithAPI(data);
        
        // If API fails, try fallback to Firebase
        if (!response.success) {
          console.log('[AuthServiceV2] API registration failed, trying Firebase fallback');
          response = await this.registerWithFirebase(data);
        }
      } else {
        // Use mock registration
        response = await this.registerWithMock(data);
      }

      if (response.success && response.user && response.token) {
        // Store auth data
        await storageService.setItem(AUTH_TOKEN_KEY, response.token);
        await storageService.setItem(USER_DATA_KEY, response.user);

        console.log('[AuthServiceV2] Registration successful for:', response.user.email);
        
        // Notify listeners
        this.notifyAuthStateChange({
          isAuthenticated: true,
          user: response.user,
          token: response.token,
          isLoading: false,
          error: null,
        });
      }

      return response;
    } catch (error) {
      console.error('[AuthServiceV2] Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during registration',
      };
    }
  }

  private async registerWithFirebase(data: RegisterData): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Attempting Firebase registration');
    
    try {
      const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, getIdToken } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update user profile with additional information
      await updateProfile(firebaseUser, {
        displayName: data.name,
      });
      
      const token = await getIdToken(firebaseUser);
      
      // Convert Firebase user to our User type
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: data.name,
        phone: data.phone,
        avatar: firebaseUser.photoURL,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVerified: firebaseUser.emailVerified,
      };

      // Send email verification
      await sendEmailVerification(firebaseUser);

      console.log('[AuthServiceV2] Firebase registration successful');
      return {
        success: true,
        user,
        token,
        message: 'Firebase registration successful. Please check your email for verification.',
      };
    } catch (error: any) {
      console.error('[AuthServiceV2] Firebase registration error:', error);
      return {
        success: false,
        error: this.getFirebaseErrorMessage(error),
      };
    }
  }

  private async registerWithAPI(data: RegisterData): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Attempting API registration');
    
    try {
      const response = await apiService.register(data);
      console.log('[AuthServiceV2] API registration result:', response.success);
      return response;
    } catch (error) {
      console.error('[AuthServiceV2] API registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API registration failed',
      };
    }
  }

  private async registerWithMock(data: RegisterData): Promise<AuthResponse> {
    console.log('[AuthServiceV2] Attempting mock registration');
    
    // Simulate network delay
    await this.delay(1500);

    // Check if user already exists (mock check)
    const existingUser = MOCK_USERS.find(user => user.email === data.email);
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists (mock mode)',
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

    // Add to mock database
    MOCK_USERS.push(newUser);

    console.log('[AuthServiceV2] Mock registration successful');
    return {
      success: true,
      user: newUser,
      token,
      message: 'Mock registration successful',
    };
  }

  async logout(): Promise<boolean> {
    console.log('[AuthServiceV2] Logout initiated in', this.currentMode, 'mode');
    
    try {
      // Handle logout based on current mode
      if (this.currentMode === 'firebase') {
        try {
          const { signOut } = await import('firebase/auth');
          await signOut(firebaseAuth);
        } catch (error) {
          console.warn('[AuthServiceV2] Firebase logout failed, continuing with local logout');
        }
      } else if (this.currentMode === 'api') {
        try {
          await apiService.logout();
        } catch (error) {
          console.warn('[AuthServiceV2] API logout failed, continuing with local logout');
        }
      }

      // Clear local auth data
      await storageService.removeItem(AUTH_TOKEN_KEY);
      await storageService.removeItem(USER_DATA_KEY);

      // Notify listeners
      this.notifyAuthStateChange({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });

      console.log('[AuthServiceV2] Logout successful');
      return true;
    } catch (error) {
      console.error('[AuthServiceV2] Logout error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('[AuthServiceV2] Getting current user in', this.currentMode, 'mode');
    
    try {
      // Try to get user from storage first
      let user = await storageService.getItem<User>(USER_DATA_KEY);
      const token = await storageService.getItem<string>(AUTH_TOKEN_KEY);

      if (!user || !token) {
        console.log('[AuthServiceV2] No cached user found');
        return null;
      }

      // If in Firebase mode, get current Firebase user
      if (this.currentMode === 'firebase') {
        const firebaseUser = firebaseAuth.currentUser;
        if (firebaseUser) {
          // Convert Firebase user to our User type
          user = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || user.name || 'User',
            phone: firebaseUser.phoneNumber || user.phone || '',
            avatar: firebaseUser.photoURL || user.avatar,
            createdAt: firebaseUser.metadata.creationTime || user.createdAt,
            updatedAt: new Date().toISOString(),
            isVerified: firebaseUser.emailVerified,
          };
          // Update cache
          await storageService.setItem(USER_DATA_KEY, user);
        }
      } else if (this.currentMode === 'api') {
        try {
          const apiUser = await apiService.getCurrentUser();
          if (apiUser) {
            user = apiUser;
            // Update cache
            await storageService.setItem(USER_DATA_KEY, user);
          }
        } catch (error) {
          console.warn('[AuthServiceV2] Failed to refresh user from API, using cached data');
        }
      }

      console.log('[AuthServiceV2] Current user found:', user.email);
      return user;
    } catch (error) {
      console.error('[AuthServiceV2] Error getting current user:', error);
      return null;
    }
  }

  async checkAuthState(): Promise<AuthState> {
    console.log('[AuthServiceV2] Checking authentication state');
    
    try {
      const user = await this.getCurrentUser();
      const token = await storageService.getItem<string>(AUTH_TOKEN_KEY);

      const authState: AuthState = {
        isAuthenticated: !!(user && token),
        user: user || null,
        token: token || null,
        isLoading: false,
        error: null,
      };

      console.log('[AuthServiceV2] Auth state checked:', authState.isAuthenticated);
      return authState;
    } catch (error) {
      console.error('[AuthServiceV2] Error checking auth state:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: 'Failed to check authentication state',
      };
    }
  }

  // Event subscription methods (unchanged)
  subscribeToAuthState(listener: (state: AuthState) => void): () => void {
    console.log('[AuthServiceV2] Adding auth state listener');
    this.authStateListeners.push(listener);

    return () => {
      console.log('[AuthServiceV2] Removing auth state listener');
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  private notifyAuthStateChange(state: AuthState): void {
    console.log('[AuthServiceV2] Notifying auth state change to', this.authStateListeners.length, 'listeners');
    this.authStateListeners.forEach(listener => listener(state));
  }

  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async clearAllAuthData(): Promise<void> {
    console.log('[AuthServiceV2] Clearing all auth data');
    
    // Clean up Firebase listener
    if (this.firebaseUnsubscribe) {
      this.firebaseUnsubscribe();
      this.firebaseUnsubscribe = null;
    }
    
    await storageService.removeItem(AUTH_TOKEN_KEY);
    await storageService.removeItem(USER_DATA_KEY);
    await storageService.removeItem(AUTH_MODE_KEY);
  }

  // Firebase auth state listener setup
  private setupFirebaseAuthListener(): void {
    console.log('[AuthServiceV2] Setting up Firebase auth state listener');
    
    // Clean up previous listener
    if (this.firebaseUnsubscribe) {
      this.firebaseUnsubscribe();
    }
    
    // Use dynamic import for Firebase auth state listener
    import('firebase/auth').then(({ onAuthStateChanged, getIdToken }) => {
      this.firebaseUnsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        console.log('[AuthServiceV2] Firebase auth state changed:', !!firebaseUser);
        
        if (firebaseUser) {
          // User is signed in
          try {
            const token = await getIdToken(firebaseUser);
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || 'User',
              phone: firebaseUser.phoneNumber || '',
              avatar: firebaseUser.photoURL,
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isVerified: firebaseUser.emailVerified,
            };
            
            // Store auth data
            await storageService.setItem(AUTH_TOKEN_KEY, token);
            await storageService.setItem(USER_DATA_KEY, user);
            
            // Sync with Supabase (fire and forget)
            supabaseService.syncFirebaseUserWithSupabase(user, token)
              .then(success => {
                if (success) {
                  console.log('[AuthServiceV2] User synced with Supabase successfully');
                } else {
                  console.warn('[AuthServiceV2] Failed to sync user with Supabase');
                }
              })
              .catch(error => {
                console.error('[AuthServiceV2] Error syncing with Supabase:', error);
              });
            
            // Notify listeners
            this.notifyAuthStateChange({
              isAuthenticated: true,
              user,
              token,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('[AuthServiceV2] Error processing Firebase user:', error);
            this.notifyAuthStateChange({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
              error: 'Failed to process Firebase user',
            });
          }
        } else {
          // User is signed out
          await storageService.removeItem(AUTH_TOKEN_KEY);
          await storageService.removeItem(USER_DATA_KEY);
          
          this.notifyAuthStateChange({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: null,
          });
        }
      });
    });
  }

  // Firebase error message handler
  private getFirebaseErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  }

  // Development utilities
  async getConnectionStatus(): Promise<{mode: AuthMode, apiConnected: boolean, firebaseConnected: boolean}> {
    const apiConnected = await apiService.checkConnection();
    const firebaseConnected = !!firebaseAuth;
    return {
      mode: this.currentMode,
      apiConnected,
      firebaseConnected
    };
  }
}

export const authServiceV2 = AuthServiceV2.getInstance();