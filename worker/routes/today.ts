import { Hono } from 'hono';
import type { Env } from '../types';
import * as db from '../lib/db';
import * as kv from '../lib/kv';
import { getUserLocation, generateActionButton } from '../lib/location';

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /api/today
 * Get today's content card
 */
router.get('/', async (c) => {
  const url = new URL(c.req.url);
  const date = url.searchParams.get('date') || db.getCurrentDate();

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
  }

  // Check cache first
  const cacheKey = `today:${date}`;
  const cached = await kv.getJson(c.env.CACHE, cacheKey);
  if (cached) {
    return c.json({ ...cached, cached: true });
  }

  // Query database
  const card = await db.first(
    c.env.DB,
    'SELECT * FROM day_cards WHERE date = ?',
    [date]
  );

  if (!card) {
    return c.json({
      date,
      title: 'Coming Soon',
      body_md: 'Stay tuned for today\'s content!',
      tags: '',
    });
  }

  // Get user location from Cloudflare headers
  const location = getUserLocation(c.req.raw);

  // Extract app integration text (usually last paragraph) and generate action button
  const paragraphs = card.body_md.split('\n\n');
  const appIntegrationText = paragraphs[paragraphs.length - 1];
  const actionButton = generateActionButton(appIntegrationText, location);

  const response = {
    ...card,
    location: location.region ? { city: location.city, state: location.region } : undefined,
    actionButton,
  };

  // Cache for 1 hour
  await kv.setJson(c.env.CACHE, cacheKey, response, 3600);

  return c.json(response);
});

/**
 * GET /api/today/calendar
 * Get all available dates
 */
router.get('/calendar', async (c) => {
  const cards = await db.all(
    c.env.DB,
    'SELECT date, title, slug FROM day_cards ORDER BY date ASC'
  );

  return c.json({ cards });
});

export default router;
