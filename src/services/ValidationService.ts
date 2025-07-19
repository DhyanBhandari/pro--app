// Form validation service
// Provides validation rules for user inputs

/**
 * Validation Service - Phase 1
 * 
 * Comprehensive validation service for form inputs including
 * email, password, phone number, and name validation with
 * customizable rules and error messages.
 * 
 * @method validateEmail - Email format validation
 * @method validatePassword - Password strength validation
 * @method validatePhone - Phone number validation
 * @method validateName - Name format validation
 */

import { ValidationError, FormValidation } from '@/types';

export class ValidationService {
  private static instance: ValidationService;

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  validateEmail(email: string): ValidationError | null {
    console.log('[ValidationService] Validating email:', email?.substring(0, 3) + '...');
    
    if (!email) {
      return { field: 'email', message: 'Email is required' };
    }

    if (email.length < 5) {
      return { field: 'email', message: 'Email is too short' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { field: 'email', message: 'Please enter a valid email address' };
    }

    return null;
  }

  validatePassword(password: string): ValidationError | null {
    console.log('[ValidationService] Validating password length:', password?.length);
    
    if (!password) {
      return { field: 'password', message: 'Password is required' };
    }

    if (password.length < 6) {
      return { field: 'password', message: 'Password must be at least 6 characters' };
    }

    if (password.length > 128) {
      return { field: 'password', message: 'Password is too long' };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { field: 'password', message: 'Password must contain at least one uppercase letter' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return { field: 'password', message: 'Password must contain at least one number' };
    }

    return null;
  }

  validatePasswordStrength(password: string): { strength: number; label: string } {
    console.log('[ValidationService] Checking password strength');
    
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return {
      strength: strength,
      label: labels[Math.min(strength, labels.length - 1)],
    };
  }

  validatePhone(phone: string): ValidationError | null {
    console.log('[ValidationService] Validating phone:', phone?.substring(0, 3) + '...');
    
    if (!phone) {
      return { field: 'phone', message: 'Phone number is required' };
    }

    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return { field: 'phone', message: 'Phone number must be at least 10 digits' };
    }

    if (cleanPhone.length > 15) {
      return { field: 'phone', message: 'Phone number is too long' };
    }

    return null;
  }

  validateName(name: string): ValidationError | null {
    console.log('[ValidationService] Validating name:', name?.substring(0, 3) + '...');
    
    if (!name) {
      return { field: 'name', message: 'Name is required' };
    }

    if (name.trim().length < 2) {
      return { field: 'name', message: 'Name must be at least 2 characters' };
    }

    if (name.length > 50) {
      return { field: 'name', message: 'Name is too long' };
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
      return { field: 'name', message: 'Name contains invalid characters' };
    }

    return null;
  }

  validateConfirmPassword(password: string, confirmPassword: string): ValidationError | null {
    console.log('[ValidationService] Validating password confirmation');
    
    if (!confirmPassword) {
      return { field: 'confirmPassword', message: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
      return { field: 'confirmPassword', message: 'Passwords do not match' };
    }

    return null;
  }

  validateLoginForm(email: string, password: string): FormValidation {
    console.log('[ValidationService] Validating login form');
    
    const errors: ValidationError[] = [];

    const emailError = this.validateEmail(email);
    if (emailError) errors.push(emailError);

    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRegisterForm(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }): FormValidation {
    console.log('[ValidationService] Validating registration form');
    
    const errors: ValidationError[] = [];

    const nameError = this.validateName(data.name);
    if (nameError) errors.push(nameError);

    const emailError = this.validateEmail(data.email);
    if (emailError) errors.push(emailError);

    const phoneError = this.validatePhone(data.phone);
    if (phoneError) errors.push(phoneError);

    const passwordError = this.validatePassword(data.password);
    if (passwordError) errors.push(passwordError);

    const confirmPasswordError = this.validateConfirmPassword(data.password, data.confirmPassword);
    if (confirmPasswordError) errors.push(confirmPasswordError);

    if (!data.acceptTerms) {
      errors.push({ field: 'acceptTerms', message: 'You must accept the terms and conditions' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  }
}

export const validationService = ValidationService.getInstance();