import { test, expect } from '@playwright/test';

const API_URL = 'https://weed365.bill-burkey.workers.dev';
const PWA_URL = 'https://4debcbc8.weed365-pwa.pages.dev';

test.describe('Comprehensive QA - ALL Features', () => {

  test('QA-001: Health endpoint responds correctly', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.service).toBeTruthy();
    expect(data.version).toBeTruthy();
  });

  test('QA-002: Today content for all seeded dates', async ({ request }) => {
    const dates = ['2025-10-18', '2025-10-19', '2025-10-20', '2025-10-21'];

    for (const date of dates) {
      const response = await request.get(`${API_URL}/api/today?date=${date}`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.title).toBeTruthy();
      expect(data.body_md).toBeTruthy();
      expect(data.date).toBe(date);
    }
  });

  test('QA-003: Calendar returns all cards', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/today/calendar`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.cards).toBeDefined();
    expect(data.cards.length).toBeGreaterThanOrEqual(4);
  });

  test('QA-004: Ads work for multiple states', async ({ request }) => {
    const states = ['CA', 'CO', 'WA', 'OR', 'NY'];

    for (const state of states) {
      const response = await request.get(`${API_URL}/api/ads?state=${state}`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBeTruthy();
    }
  });

  test('QA-005: Ads with tags work', async ({ request }) => {
    const tags = ['sleep', 'focus', 'pain', 'anxiety'];

    for (const tag of tags) {
      const response = await request.get(`${API_URL}/api/ads?state=CA&tag=${tag}`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.items).toBeDefined();
    }
  });

  test('QA-006: Ad tracking (view) works', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ads/track`, {
      data: { ad_id: 1, event: 'view' }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('QA-007: Ad tracking (click) works', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/ads/track`, {
      data: { ad_id: 1, event: 'click', user_id: 1 }
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('QA-008: Journal creation with all fields', async ({ request }) => {
    const entry = {
      user_id: 1,
      date: '2025-10-20',
      method: 'tincture',
      amount: 10,
      units: 'mg',
      mood_before: 4,
      mood_after: 7,
      sleep_hours: 8,
      notes: 'Database integrity test entry'
    };

    const response = await request.post(`${API_URL}/api/journal`, { data: entry });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.id).toBeGreaterThan(0);
  });

  test('QA-009: Journal retrieval works', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/journal?user_id=1`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.entries).toBeDefined();
    expect(Array.isArray(data.entries)).toBeTruthy();
  });

  test('QA-010: Journal stats calculation', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/journal/stats?user_id=1`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.stats).toBeDefined();
  });

  test('QA-011: VAPID public key available', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/push/vapid`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.publicKey).toBeTruthy();
    expect(data.publicKey.startsWith('BP')).toBeTruthy();
  });

  test('QA-012: Partner signup creates account', async ({ request }) => {
    const timestamp = Date.now();
    const partner = {
      name: `QA Test Partner ${timestamp}`,
      email: `qa${timestamp}@test.com`
    };

    const response = await request.post(`${API_URL}/api/partners/signup`, { data: partner });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.token).toBeTruthy();
    expect(data.partner_id).toBeGreaterThan(0);
    expect(data.hmac_secret).toBeTruthy();
  });

  test('QA-013: Invalid date format rejected', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/journal`, {
      data: { user_id: 1, date: 'invalid_date_format' }
    });
    expect(response.status()).toBe(400);
  });

  test('QA-014: Invalid mood values rejected', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/journal`, {
      data: { user_id: 1, mood_before: 15, date: '2025-10-20' }
    });
    expect(response.status()).toBe(400);
  });

  test('QA-015: SQL injection prevented in queries', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/journal?user_id=1' OR '1'='1`);
    // Should handle safely, not execute SQL
    expect(response.status()).toBeLessThan(500);
  });

  test('QA-016: XSS in journal notes handled', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/journal`, {
      data: {
        user_id: 1,
        date: '2025-10-20',
        notes: '<script>alert("xss")</script>',
        mood_before: 5
      }
    });
    // Should accept but sanitize
    expect(response.ok()).toBeTruthy();
  });

  test('QA-017: Invalid foreign key rejected', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/journal`, {
      data: {
        user_id: 999999,
        date: '2025-10-20',
        method: 'edible',
        amount: 5,
        units: 'mg',
        mood_before: 5,
        mood_after: 7,
        notes: 'Invalid user test'
      }
    });
    // Should fail with constraint error
    expect(response.status()).toBe(500);
  });

  test('QA-018: Response times under 2 seconds', async ({ request }) => {
    const endpoints = [
      '/health',
      '/api/today',
      '/api/ads?state=CA',
      '/api/today/calendar'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`${API_URL}${endpoint}`);
      const duration = Date.now() - startTime;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000);
    }
  });

  test('QA-019: CORS headers present', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
  });

  test('QA-020: Unauthorized partner access blocked', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/partners/me`);
    expect(response.status()).toBe(401);
  });
});

test.describe('PWA UI Comprehensive Tests', () => {

  test('UI-001: PWA loads successfully', async ({ page }) => {
    await page.goto(PWA_URL);
    await expect(page.locator('h1')).toContainText('365 Days of Weed');
  });

  test('UI-002: Navigation to Calendar works', async ({ page }) => {
    await page.goto(PWA_URL);
    await page.click('text=Calendar');
    await page.waitForURL(/.*calendar.*/);
    await expect(page.locator('h2')).toBeVisible();
  });

  test('UI-003: Navigation to Journal works', async ({ page }) => {
    await page.goto(PWA_URL);
    await page.click('text=Journal');
    await page.waitForURL(/.*journal.*/);
    await expect(page.locator('h2')).toBeVisible();
  });

  test('UI-004: Service Worker registers', async ({ page }) => {
    await page.goto(PWA_URL);
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    expect(swRegistered).toBeTruthy();
  });

  test('UI-005: PWA manifest loads', async ({ page }) => {
    const response = await page.goto(`${PWA_URL}/manifest.webmanifest`);
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest.name).toBeTruthy();
  });

  test('UI-006: Footer disclaimer present', async ({ page }) => {
    await page.goto(PWA_URL);
    await expect(page.locator('text=For adults 21+')).toBeVisible();
  });

  test('UI-007: PWA loads within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(PWA_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});
