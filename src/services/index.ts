// Services barrel export
// Centralizes all service exports

/**
 * Services Export - Phase 1
 * 
 * Barrel export for all application services including
 * authentication, storage, and validation services.
 * 
 * @usage import { authService, storageService } from '@/services'
 */

export { AuthService, authService } from './AuthService';
export { StorageService, storageService } from './StorageService';
export { ValidationService, validationService } from './ValidationService';