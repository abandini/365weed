/**
 * Centralized configuration for the application
 * Single source of truth for all config values
 */

/**
 * API base URL - supports both development and production
 * In dev: uses local worker or VITE_API_URL env var
 * In prod: uses deployed worker URL
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

/**
 * Environment detection
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * Feature flags
 */
export const FEATURES = {
  DAILY_CHALLENGES: true,
  MUNCHIES_TRACKER: true,
  EASTER_EGGS: true,
  CURATED_LISTS: true,
  RECOMMENDATIONS: true,
};

/**
 * App constants
 */
export const CONSTANTS = {
  // Points
  DAILY_CHECKIN_POINTS: 10,
  EASTER_EGG_420_POINTS: 42,
  EASTER_EGG_KONAMI_POINTS: 100,
  EASTER_EGG_SHAKE_POINTS: 25,
  EASTER_EGG_TRIPLE_TAP_POINTS: 50,
  MUNCHIES_LOG_POINTS: 5,

  // Achievements
  MUNCHIE_MASTER_THRESHOLD: 20,

  // Limits
  MAX_JOURNAL_ENTRIES: 90,
  MAX_JOURNAL_DAYS: 365,
  SUBSCRIPTION_PRO_JOURNAL_DAYS: 365,
  SUBSCRIPTION_FREE_JOURNAL_DAYS: 30,
};

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  DAILY_CHALLENGE: 'daily_challenge',
  MUNCHIES_LOG: 'munchies_log',
  LAST_420_SHOWN: 'last_420_shown',
  LAST_KONAMI_SHOWN: 'last_konami_shown',
  LAST_SHAKE_SHOWN: 'last_shake_shown',
  LAST_TRIPLETAP_SHOWN: 'last_tripletap_shown',
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  THEME: 'theme',
};
