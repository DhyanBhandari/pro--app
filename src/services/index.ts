// Services barrel export
// Centralizes all service exports

/**
 * Services Export - Phase 2
 * 
 * Barrel export for all application services including
 * authentication, storage, validation, and API services.
 * 
 * @usage import { authService, apiService } from '@/services'
 */

export { AuthService, authService } from './AuthService';
export { AuthServiceV2, authServiceV2 } from './AuthServiceV2';
export { StorageService, storageService } from './StorageService';
export { ValidationService, validationService } from './ValidationService';
export { ApiService, apiService } from './ApiService';
export { MatchingService, matchingService } from './MatchingService';
export { supabaseService } from './SupabaseService';