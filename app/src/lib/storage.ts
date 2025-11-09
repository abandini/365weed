/**
 * Safe localStorage wrapper with error handling
 * Prevents crashes when localStorage is unavailable (private browsing, quota exceeded, etc.)
 */

/**
 * Get item from localStorage
 * Returns null if not found or on error
 */
export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`localStorage.getItem failed for key "${key}":`, error);
    return null;
  }
}

/**
 * Set item in localStorage
 * Returns true if successful, false on error
 */
export function setItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`localStorage.setItem failed for key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage
 * Returns true if successful, false on error
 */
export function removeItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`localStorage.removeItem failed for key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * Returns true if successful, false on error
 */
export function clear(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('localStorage.clear failed:', error);
    return false;
  }
}

/**
 * Get JSON object from localStorage
 * Returns null if not found, invalid JSON, or on error
 */
export function getJSON<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`localStorage.getJSON failed for key "${key}":`, error);
    return null;
  }
}

/**
 * Set JSON object in localStorage
 * Returns true if successful, false on error
 */
export function setJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`localStorage.setJSON failed for key "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * Useful for feature detection
 */
export function isAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all keys from localStorage
 * Returns empty array on error
 */
export function keys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('localStorage.keys failed:', error);
    return [];
  }
}

/**
 * Get storage usage information (if available)
 * Returns null if not supported
 */
export async function getUsage(): Promise<{ used: number; quota: number } | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
}
