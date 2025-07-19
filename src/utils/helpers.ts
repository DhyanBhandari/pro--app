// Utility helper functions
// Common utility functions used throughout the app

/**
 * Utility Helpers - Phase 1
 * 
 * Collection of utility functions for common operations
 * including string manipulation, validation, and formatting.
 * 
 * @category String - String manipulation utilities
 * @category Validation - Validation helper functions
 * @category Format - Data formatting utilities
 */

import { Platform } from 'react-native';

export const stringHelpers = {
  capitalize: (str: string): string => {
    console.log('[Helpers] Capitalizing string');
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  capitalizeWords: (str: string): string => {
    console.log('[Helpers] Capitalizing words');
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  truncate: (str: string, length: number = 50): string => {
    console.log('[Helpers] Truncating string to length:', length);
    return str.length > length ? str.substring(0, length) + '...' : str;
  },

  removeSpaces: (str: string): string => {
    return str.replace(/\s/g, '');
  },

  slugify: (str: string): string => {
    console.log('[Helpers] Creating slug from string');
    return str
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  },

  maskEmail: (email: string): string => {
    console.log('[Helpers] Masking email');
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    return `${localPart.slice(0, 2)}***@${domain}`;
  },

  maskPhone: (phone: string): string => {
    console.log('[Helpers] Masking phone number');
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return `***-***-${cleaned.slice(-4)}`;
  },
};

export const validationHelpers = {
  isValidUrl: (url: string): boolean => {
    console.log('[Helpers] Validating URL');
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isNumeric: (str: string): boolean => {
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
  },

  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  isValidJSON: (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },
};

export const formatHelpers = {
  formatPhone: (phone: string): string => {
    console.log('[Helpers] Formatting phone number');
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    }
    
    return phone;
  },

  formatCurrency: (amount: number, currency: string = 'USD'): string => {
    console.log('[Helpers] Formatting currency:', amount, currency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  formatDate: (date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string => {
    console.log('[Helpers] Formatting date:', date, format);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
      default:
        return dateObj.toLocaleDateString('en-US');
    }
  },

  formatFileSize: (bytes: number): string => {
    console.log('[Helpers] Formatting file size:', bytes);
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  formatNumber: (num: number): string => {
    console.log('[Helpers] Formatting number:', num);
    return new Intl.NumberFormat('en-US').format(num);
  },
};

export const arrayHelpers = {
  shuffle: <T>(array: T[]): T[] => {
    console.log('[Helpers] Shuffling array of length:', array.length);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  unique: <T>(array: T[]): T[] => {
    console.log('[Helpers] Removing duplicates from array');
    return [...new Set(array)];
  },

  chunk: <T>(array: T[], size: number): T[][] => {
    console.log('[Helpers] Chunking array into size:', size);
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    console.log('[Helpers] Grouping array by key:', String(key));
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
};

export const deviceHelpers = {
  isIOS: (): boolean => {
    return Platform.OS === 'ios';
  },

  isAndroid: (): boolean => {
    return Platform.OS === 'android';
  },

  getDeviceInfo: () => {
    console.log('[Helpers] Getting device info');
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isDev: __DEV__,
    };
  },
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

