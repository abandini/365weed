import { test as base } from '@playwright/test';

const API_URL = process.env.BASE_URL || 'https://weed365.bill-burkey.workers.dev';
const PWA_URL = process.env.PWA_URL || 'https://4debcbc8.weed365-pwa.pages.dev';

// Helper to check if a URL is reachable
async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok || response.status < 500;
  } catch (error) {
    return false;
  }
}

// Custom test fixture that checks service availability
export const test = base.extend({
  // Automatically skip tests if services are unreachable (for local dev)
  serviceCheck: async ({}, use, testInfo) => {
    // Only check in non-CI environments
    if (!process.env.CI) {
      const isApiReachable = await isUrlReachable(API_URL + '/health');
      const isPwaReachable = await isUrlReachable(PWA_URL);

      if (!isApiReachable && testInfo.title.includes('API')) {
        testInfo.skip(true, 'API service not reachable (local environment)');
      }
      if (!isPwaReachable && testInfo.title.includes('PWA')) {
        testInfo.skip(true, 'PWA service not reachable (local environment)');
      }
    }
    await use();
  },
});

export { expect } from '@playwright/test';
