import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, AdResponse } from '../types';
import * as db from '../lib/db';
import * as kv from '../lib/kv';

const router = new Hono<{ Bindings: Env }>();

// Query parameter schema
const adsQuerySchema = z.object({
  state: z.string().length(2).optional(),
  tag: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/ads
 * Serve ads based on location, date, and tags
 */
router.get('/', async (c) => {
  try {
    const params = new URL(c.req.url).searchParams;
    const query = adsQuerySchema.parse({
      state: params.get('state') || undefined,
      tag: params.get('tag') || undefined,
      date: params.get('date') || undefined,
    });

    const today = query.date ?? db.getCurrentDate();
    const region = (query.state ?? 'NA').toUpperCase();

    // Check if user is Pro (no ads)
    const isPro = c.get('isPro');
    if (isPro) {
      return c.json({ source: 'pro', items: [] });
    }

    // 1. Try KV by exact date key
    const kvKey = `${region}-${today}`;
    const kvAds = await kv.getJson(c.env.ADS, kvKey);
    if (kvAds) {
      const items = Array.isArray(kvAds) ? kvAds : [kvAds];
      return c.json({ source: 'kv', items } as AdResponse);
    }

    // 2. Try KV tag-based fallback
    if (query.tag) {
      const tagKey = `${region}-${query.tag}`;
      const tagAds = await kv.getJson(c.env.ADS, tagKey);
      if (tagAds) {
        const items = Array.isArray(tagAds) ? tagAds : [tagAds];
        return c.json({ source: 'kv:tag', items } as AdResponse);
      }
    }

    // 3. Fallback to D1 query (active campaigns)
    const results = await db.all(
      c.env.DB,
      `SELECT a.* FROM ads a
       WHERE a.region = ?
         AND date(?) BETWEEN a.start_date AND a.end_date
         AND (a.tag IS NULL OR a.tag = COALESCE(?, a.tag))
       ORDER BY RANDOM()
       LIMIT 3`,
      [region, today, query.tag ?? null]
    );

    return c.json({ source: 'd1', items: results } as AdResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid query parameters', details: error.errors }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/ads/track
 * Track ad impressions (view/click)
 */
router.post('/track', async (c) => {
  try {
    const body = await c.req.json();
    const { ad_id, user_id, event, date } = body;

    if (!ad_id || !event || !['view', 'click'].includes(event)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const trackDate = date ?? db.getCurrentDate();

    await db.execute(
      c.env.DB,
      'INSERT INTO ad_impressions(ad_id, user_id, date, event_type) VALUES (?, ?, ?, ?)',
      [ad_id, user_id ?? null, trackDate, event]
    );

    // Increment frequency cap counter if user_id provided
    if (user_id) {
      const capKey = `cap:${user_id}:${ad_id}:${trackDate.replace(/-/g, '')}`;
      await kv.increment(c.env.CACHE, capKey, 24 * 3600); // 24h TTL
    }

    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: 'Failed to track ad' }, 500);
  }
});

export default router;
