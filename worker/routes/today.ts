import { Hono } from 'hono';
import type { Env } from '../types';
import * as db from '../lib/db';
import * as kv from '../lib/kv';

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

  // Cache for 1 hour
  await kv.setJson(c.env.CACHE, cacheKey, card, 3600);

  return c.json(card);
});

/**
 * GET /api/today/calendar
 * Get all available dates
 */
router.get('/calendar', async (c) => {
  const cards = await db.all(
    c.env.DB,
    'SELECT date, title, slug FROM day_cards ORDER BY date DESC LIMIT 365'
  );

  return c.json({ cards });
});

export default router;
