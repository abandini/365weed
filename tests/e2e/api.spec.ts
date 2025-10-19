import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check returns OK', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.service).toBe('365 Days of Weed API');
  });

  test('today endpoint returns content', async ({ request }) => {
    const response = await request.get('/api/today');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('body_md');
    expect(data).toHaveProperty('date');
  });

  test('ads endpoint returns for CA', async ({ request }) => {
    const response = await request.get('/api/ads?state=CA');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBeTruthy();
  });

  test('journal creation works', async ({ request }) => {
    const entry = {
      user_id: 999,
      date: '2025-10-18',
      method: 'edible',
      amount: 5,
      units: 'mg',
      mood_before: 6,
      mood_after: 8,
      notes: 'Test entry from E2E',
    };

    const response = await request.post('/api/journal', {
      data: entry,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.id).toBeGreaterThan(0);
  });

  test('calendar endpoint returns cards', async ({ request }) => {
    const response = await request.get('/api/today/calendar');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('cards');
    expect(Array.isArray(data.cards)).toBeTruthy();
  });
});
