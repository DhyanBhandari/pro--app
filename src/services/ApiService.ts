// API Service for FastAPI Backend Integration
// Handles all HTTP requests to the Phase 2 FastAPI backend

/**
 * API Service - Phase 2
 * 
 * Connects React Native app to FastAPI backend with:
 * - Authentication endpoints
 * - Intent creation and matching
 * - User management
 * - Error handling and retry logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';

// Dynamic API URL - will be determined at runtime  
let BASE_URL = 'http://localhost:8000/api';
const AUTH_TOKEN_KEY = 'access_token';

interface IntentCreate {
  raw_query: string;
  location_name?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface IntentResponse {
  intent_id: string;
  user_id: string;
  post_type: 'demand' | 'supply';
  category: string;
  raw_query: string;
  parsed_data?: any;
  location_name?: string;
  is_active: boolean;
  created_at: string;
  valid_until: string;
}

interface MatchResponse {
  intent_id: string;
  user_name: string;
  location_name: string;
  raw_query: string;
  category: string;
  post_type: string;
  similarity: number;
  distance_km: number;
  combined_score: number;
  created_at: string;
}

export class ApiService {
  private static instance: ApiService;
  private baseUrlInitialized = false;

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async findWorkingUrl(): Promise<string | null> {
    const urls = [
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://192.168.1.40:8000',  // Your local IP
      'http://localhost:8001', 
      'http://127.0.0.1:8001',
      'http://192.168.13.236:8000',
      'http://10.0.2.2:8000'  // Android emulator
    ];

    for (const url of urls) {
      try {
        console.log(`[ApiService] Testing ${url}...`);
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url + '/', {
          method: 'GET',
          signal: controller.signal,
        });
        
        if (response.ok) {
          console.log(`[ApiService] Found working URL: ${url}`);
          return url;
        }
      } catch (error) {
        console.log(`[ApiService] ${url} failed:`, error instanceof Error ? error.message : error);
      }
    }
    
    return null;
  }

  private async ensureBaseUrl(): Promise<void> {
    if (this.baseUrlInitialized) return;
    
    const workingUrl = await this.findWorkingUrl();
    if (workingUrl) {
      BASE_URL = workingUrl + '/api';
      console.log(`[ApiService] Using BASE_URL: ${BASE_URL}`);
    } else {
      console.warn('[ApiService] No working URL found, keeping default:', BASE_URL);
    }
    
    this.baseUrlInitialized = true;
  }

  private createTimeoutSignal(timeoutMs: number): AbortSignal | null {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeoutMs);
      return controller.signal;
    } catch {
      // If AbortController is not available, return null
      return null;
    }
  }

  private async getAuthHeaders(customToken?: string): Promise<Record<string, string>> {
    let token = customToken || await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    // In development mode, use test-token if no token is available
    if (!token && __DEV__) {
      token = 'test-token';
      console.log('[ApiService] Using test-token for development');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure we have a working base URL
    await this.ensureBaseUrl();
    
    const url = `${BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    console.log(`[ApiService] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        // Add timeout for network requests (React Native compatible)
        ...(this.createTimeoutSignal(30000) && { signal: this.createTimeoutSignal(30000) }),
      });

      const responseText = await response.text();
      console.log(`[ApiService] Response ${response.status}:`, responseText.substring(0, 200));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (!responseText) {
        return {} as T;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error(`[ApiService] Request failed:`, error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error(`Network Error: Cannot connect to server at ${BASE_URL}. 
        
For development:
- Make sure the backend server is running (check if http://localhost:8000/ works in browser)
- If on physical device, update BASE_URL to use your computer's IP address
- If on emulator, you may need to use http://10.0.2.2:8000/api`);
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: Server took too long to respond');
      }
      
      throw error;
    }
  }

  // Health and Debug
  async healthCheck(): Promise<any> {
    return this.makeRequest('/health');
  }

  async debugInfo(): Promise<any> {
    return this.makeRequest('/debug/info');
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[ApiService] Login request for:', credentials.email);

    try {
      const response = await this.makeRequest<{
        access_token: string;
        token_type: string;
        user: any;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Store token
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);

      const user: User = {
        id: response.user.user_id,
        email: response.user.email,
        name: response.user.name,
        phone: response.user.phone,
        avatar: null,
        createdAt: response.user.created_at,
        updatedAt: response.user.created_at,
        isVerified: true,
      };

      console.log('[ApiService] Login successful for:', user.email);

      return {
        success: true,
        user,
        token: response.access_token,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('[ApiService] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('[ApiService] Registration request for:', data.email);

    try {
      const registerData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        interests: [],
        bio: null,
      };

      const response = await this.makeRequest<{
        access_token: string;
        token_type: string;
        user: any;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      // Store token
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);

      const user: User = {
        id: response.user.user_id,
        email: response.user.email,
        name: response.user.name,
        phone: response.user.phone,
        avatar: null,
        createdAt: response.user.created_at,
        updatedAt: response.user.created_at,
        isVerified: true,
      };

      console.log('[ApiService] Registration successful for:', user.email);

      return {
        success: true,
        user,
        token: response.access_token,
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('[ApiService] Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<boolean> {
    console.log('[ApiService] Logout request');

    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      
      console.log('[ApiService] Logout successful');
      return true;
    } catch (error) {
      console.error('[ApiService] Logout error:', error);
      // Still remove local token even if server request fails
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      return false;
    }
  }

  // User Management
  async getCurrentUser(): Promise<User | null> {
    console.log('[ApiService] Getting current user');

    try {
      const response = await this.makeRequest<any>('/users/me');
      
      const user: User = {
        id: response.user_id,
        email: response.email,
        name: response.name,
        phone: response.phone,
        avatar: null,
        createdAt: response.created_at,
        updatedAt: response.created_at,
        isVerified: true,
      };

      console.log('[ApiService] Current user retrieved:', user.email);
      return user;
    } catch (error) {
      console.error('[ApiService] Error getting current user:', error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const response = await this.makeRequest<any>(`/users/profile/${userId}`);
      
      const user: User = {
        id: response.user_id,
        email: response.email || '',
        name: response.name,
        phone: response.phone,
        avatar: null,
        createdAt: response.created_at,
        updatedAt: response.created_at,
        isVerified: true,
      };

      return user;
    } catch (error) {
      console.error('[ApiService] Error getting user profile:', error);
      return null;
    }
  }

  // Intent Management
  async createIntent(intentData: IntentCreate, authToken?: string): Promise<IntentResponse | null> {
    console.log('[ApiService] Creating intent:', intentData.raw_query);

    try {
      // Ensure we have a working base URL
      await this.ensureBaseUrl();
      
      // Use longer timeout for intent creation due to ML processing
      const url = `${BASE_URL}/intents`;
      const headers = await this.getAuthHeaders(authToken);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(intentData),
        ...(this.createTimeoutSignal(60000) && { signal: this.createTimeoutSignal(60000) }), // 60 second timeout
      });

      const responseText = await response.text();
      console.log(`[ApiService] Response ${response.status}:`, responseText.substring(0, 200));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const intentResponse = JSON.parse(responseText) as IntentResponse;

      console.log('[ApiService] Intent created:', intentResponse.intent_id);
      console.log('[ApiService] Parsed as:', intentResponse.post_type, intentResponse.category);
      
      return intentResponse;
    } catch (error) {
      console.error('[ApiService] Error creating intent:', error);
      return null;
    }
  }

  async getMatches(intentId: string): Promise<MatchResponse[]> {
    console.log('[ApiService] Getting matches for intent:', intentId);

    try {
      const response = await this.makeRequest<MatchResponse[]>(`/intents/${intentId}/matches`);
      
      console.log('[ApiService] Found', response.length, 'matches');
      return response;
    } catch (error) {
      console.error('[ApiService] Error getting matches:', error);
      return [];
    }
  }

  async getMyIntents(): Promise<IntentResponse[]> {
    console.log('[ApiService] Getting user intents');

    try {
      const response = await this.makeRequest<IntentResponse[]>('/intents/my');
      
      console.log('[ApiService] Found', response.length, 'user intents');
      return response;
    } catch (error) {
      console.error('[ApiService] Error getting user intents:', error);
      return [];
    }
  }

  async deactivateIntent(intentId: string): Promise<boolean> {
    console.log('[ApiService] Deactivating intent:', intentId);

    try {
      await this.makeRequest(`/intents/${intentId}`, { method: 'DELETE' });
      
      console.log('[ApiService] Intent deactivated successfully');
      return true;
    } catch (error) {
      console.error('[ApiService] Error deactivating intent:', error);
      return false;
    }
  }

  // Utility Methods
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  async clearAuthData(): Promise<void> {
    console.log('[ApiService] Clearing auth data');
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  // For development/testing
  async testEndpoint(): Promise<any> {
    try {
      console.log('[ApiService] Testing connection to:', BASE_URL);
      
      // Test basic connectivity first
      const rootResponse = await fetch('http://localhost:8000/', {
        method: 'GET',
        ...(this.createTimeoutSignal(10000) && { signal: this.createTimeoutSignal(10000) }),
      });
      
      if (!rootResponse.ok) {
        throw new Error(`Root endpoint failed: ${rootResponse.status}`);
      }
      
      const health = await this.healthCheck();
      const debug = await this.debugInfo();
      
      return {
        baseUrl: BASE_URL,
        rootEndpoint: 'accessible',
        health,
        debug,
        connection: 'success',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[ApiService] Test endpoint error:', error);
      return {
        baseUrl: BASE_URL,
        connection: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Test multiple connection options
  async testAllConnections(): Promise<any> {
    const urls = [
      'http://localhost:8000/',
      'http://127.0.0.1:8000/',
      'http://192.168.13.236:8000/',
      'http://10.0.2.2:8000/'
    ];

    const results = [];
    
    for (const url of urls) {
      try {
        console.log(`[ApiService] Testing ${url}...`);
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });
        
        if (response.ok) {
          const data = await response.text();
          results.push({
            url,
            status: 'success',
            data: data.substring(0, 100)
          });
        } else {
          results.push({
            url,
            status: 'failed',
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        results.push({
          url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // Simple connectivity test
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('[ApiService] Testing basic connectivity...');
      
      const response = await fetch('http://localhost:8000/', {
        method: 'GET',
        ...(this.createTimeoutSignal(5000) && { signal: this.createTimeoutSignal(5000) }),
      });
      
      if (response.ok) {
        const data = await response.text();
        return {
          success: true,
          message: 'Connection successful',
          details: data.substring(0, 100),
        };
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ApiService] Connection test failed:', errorMessage);
      
      return {
        success: false,
        message: `Connection failed: ${errorMessage}`,
        details: {
          baseUrl: BASE_URL,
          error: errorMessage,
        },
      };
    }
  }
}

export const apiService = ApiService.getInstance();

// Export types for use in components
export type { IntentCreate, IntentResponse, MatchResponse };