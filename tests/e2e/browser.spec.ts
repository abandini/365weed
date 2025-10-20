import { test, expect } from '@playwright/test';

const PWA_URL = 'https://4debcbc8.weed365-pwa.pages.dev';
const API_URL = 'https://weed365.bill-burkey.workers.dev';

test.describe('PWA Browser Tests', () => {
  test('PWA loads and displays today content', async ({ page }) => {
    await page.goto(PWA_URL);

    // Check navigation
    await expect(page.locator('h1')).toContainText('365 Days of Weed');

    // Check that any content loads (looking for common content elements)
    await page.waitForSelector('h2, article, .prose', { timeout: 10000 });

    // Verify we're not seeing error state
    await expect(page.locator('text=Error:')).not.toBeVisible();
  });

  test('Navigation works', async ({ page }) => {
    await page.goto(PWA_URL);

    // Navigate to Calendar
    await page.click('text=Calendar');
    await expect(page).toHaveURL(new RegExp('/calendar'));
    await expect(page.locator('h2')).toContainText('Content Calendar');

    // Navigate to Journal
    await page.click('text=Journal');
    await expect(page).toHaveURL(new RegExp('/journal'));
    await expect(page.locator('h2')).toContainText('My Journal');

    // Navigate back to Today
    await page.click('text=Today');
    await expect(page).toHaveURL(PWA_URL + '/');
  });

  test('Journal entry form works', async ({ page }) => {
    await page.goto(`${PWA_URL}/journal`);

    // Open journal form
    await page.click('text=New Entry');

    // Fill in form
    await page.fill('input[name="date"]', '2025-10-18');
    await page.selectOption('select[name="method"]', 'edible');
    await page.fill('input[name="amount"]', '5');
    await page.fill('input[name="mood_before"]', '6');
    await page.fill('input[name="mood_after"]', '8');
    await page.fill('input[name="sleep_hours"]', '7.5');
    await page.fill('textarea[name="notes"]', 'Test entry from browser automation');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success (form closes)
    await page.waitForTimeout(2000);

    // Verify entry appears in list (may be multiple entries with same date)
    const entries = page.locator('text=2025-10-18');
    await expect(entries.first()).toBeVisible();
  });

  test('Sponsored ads display', async ({ page }) => {
    await page.goto(PWA_URL);

    // Set user state in localStorage to get ads
    await page.evaluate(() => {
      localStorage.setItem('user_state', 'CA');
    });

    // Reload to fetch ads with state
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for sponsored section (or verify no ads is acceptable)
    const sponsoredExists = await page.locator('text=Sponsored').count() > 0;
    if (sponsoredExists) {
      await expect(page.locator('text=Sponsored')).toBeVisible();
      // Check for ad content
      const adExists = await page.locator('[href*="partner.example.com"]').count() > 0;
      expect(adExists).toBeTruthy();
    }
    // If no ads, that's okay - means no active campaigns for this user
  });

  test('PWA manifest is valid', async ({ page }) => {
    const response = await page.goto(`${PWA_URL}/manifest.webmanifest`);
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
  });

  test('Service worker registers', async ({ page }) => {
    await page.goto(PWA_URL);

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    expect(swRegistered).toBeTruthy();
  });
});

test.describe('API Integration Tests', () => {
  test('Partner signup flow', async ({ request }) => {
    const partner = {
      name: `Test Partner ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
    };

    const response = await request.post(`${API_URL}/api/partners/signup`, {
      data: partner,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.token).toBeTruthy();
    expect(data.partner_id).toBeGreaterThan(0);
  });

  test('Complete journal workflow', async ({ request }) => {
    // Create entry
    const entry = {
      user_id: 1,
      date: '2025-10-18',
      method: 'vape',
      amount: 3,
      units: 'puffs',
      mood_before: 5,
      mood_after: 7,
      sleep_hours: 8,
      notes: 'Automation test entry',
    };

    const createResponse = await request.post(`${API_URL}/api/journal`, {
      data: entry,
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    expect(createData.id).toBeGreaterThan(0);

    // Fetch entries
    const getResponse = await request.get(`${API_URL}/api/journal?user_id=1`);
    expect(getResponse.ok()).toBeTruthy();
    const getData = await getResponse.json();
    expect(getData.entries.length).toBeGreaterThan(0);

    // Get stats
    const statsResponse = await request.get(`${API_URL}/api/journal/stats?user_id=1&days=30`);
    expect(statsResponse.ok()).toBeTruthy();
    const statsData = await statsResponse.json();
    expect(statsData.stats).toBeTruthy();
  });

  test('Ad serving with different states', async ({ request }) => {
    const states = ['CA', 'CO', 'WA', 'OR'];

    for (const state of states) {
      const response = await request.get(`${API_URL}/api/ads?state=${state}`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBeTruthy();
    }
  });
});

test.describe('Performance Tests', () => {
  test('API response times are acceptable', async ({ request }) => {
    const endpoints = [
      '/health',
      '/api/today',
      '/api/ads?state=CA',
      '/api/today/calendar',
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`${API_URL}${endpoint}`);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000); // Less than 2 seconds
    }
  });

  test('PWA loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(PWA_URL);
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(5000); // Less than 5 seconds
  });
});
