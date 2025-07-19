// Async storage wrapper service
// Handles local data persistence with error handling

/**
 * Storage Service - Phase 1
 * 
 * Wrapper service for AsyncStorage providing type-safe methods
 * for storing and retrieving data locally on the device.
 * 
 * @method setItem - Store data with key
 * @method getItem - Retrieve data by key
 * @method removeItem - Delete data by key
 * @method clear - Clear all stored data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
  private static instance: StorageService;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      console.log('[StorageService] Setting item:', key);
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('[StorageService] Error setting item:', key, error);
      return false;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      console.log('[StorageService] Getting item:', key);
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        console.log('[StorageService] No value found for key:', key);
        return null;
      }
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error('[StorageService] Error getting item:', key, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      console.log('[StorageService] Removing item:', key);
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[StorageService] Error removing item:', key, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      console.log('[StorageService] Clearing all storage');
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      console.log('[StorageService] Getting all keys');
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error('[StorageService] Error getting keys:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<Record<string, any>> {
    try {
      console.log('[StorageService] Getting multiple items:', keys);
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};
      
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('[StorageService] Error in multiGet:', error);
      return {};
    }
  }

  async multiSet(keyValuePairs: Array<[string, any]>): Promise<boolean> {
    try {
      console.log('[StorageService] Setting multiple items:', keyValuePairs.length);
      const stringPairs = keyValuePairs.map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(stringPairs);
      return true;
    } catch (error) {
      console.error('[StorageService] Error in multiSet:', error);
      return false;
    }
  }
}

export const storageService = StorageService.getInstance();