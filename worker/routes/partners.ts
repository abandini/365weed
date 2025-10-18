import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';
import * as db from '../lib/db';
import * as jwt from '../lib/jwt';
import { generateHmacSecret } from '../lib/hmac';

const router = new Hono<{ Bindings: Env }>();

// Campaign schema
const campaignSchema = z.object({
  name: z.string().min(1),
  region: z.string().length(2),
  tag: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Creative schema
const creativeSchema = z.object({
  campaign_id: z.number(),
  title: z.string().min(1),
  body_md: z.string(),
  image_url: z.string().url(),
  target_url: z.string().url(),
  cpm_rate: z.number().min(0),
  variant_group: z.string().optional(),
  weight: z.number().min(0).max(10).optional(),
});

/**
 * Middleware: Verify partner JWT
 */
async function verifyPartnerAuth(c: any, next: any) {
  const authHeader = c.req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await jwt.verifyToken(token, c.env.JWT_SECRET);

  if (!payload || !payload.partner_id) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('partner_id', payload.partner_id);
  await next();
}

/**
 * POST /api/partners/signup
 * Register a new partner
 */
router.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email } = body;

    if (!name || !email) {
      return c.json({ error: 'name and email required' }, 400);
    }

    // Check if partner already exists
    const existing = await db.first(
      c.env.DB,
      'SELECT id FROM partners WHERE email = ?',
      [email]
    );

    if (existing) {
      return c.json({ error: 'Partner already exists' }, 400);
    }

    // Generate HMAC secret
    const hmacSecret = generateHmacSecret();

    // Insert partner
    const partnerId = await db.insert(
      c.env.DB,
      'INSERT INTO partners (name, email, hmac_secret) VALUES (?, ?, ?)',
      [name, email, hmacSecret]
    );

    // Create JWT token
    const token = await jwt.createToken(
      { partner_id: partnerId, email },
      c.env.JWT_SECRET
    );

    return c.json({
      ok: true,
      partner_id: partnerId,
      token,
      hmac_secret: hmacSecret,
    });
  } catch (error) {
    return c.json({ error: 'Signup failed' }, 500);
  }
});

/**
 * GET /api/partners/me
 * Get partner profile
 */
router.get('/me', verifyPartnerAuth, async (c) => {
  const partnerId = c.get('partner_id');

  const partner = await db.first(
    c.env.DB,
    'SELECT id, name, email, created_at FROM partners WHERE id = ?',
    [partnerId]
  );

  if (!partner) {
    return c.json({ error: 'Partner not found' }, 404);
  }

  return c.json({ partner });
});

/**
 * GET /api/partners/campaigns
 * Get all campaigns for a partner
 */
router.get('/campaigns', verifyPartnerAuth, async (c) => {
  const partnerId = c.get('partner_id');

  const campaigns = await db.all(
    c.env.DB,
    'SELECT * FROM campaigns WHERE partner_id = ? ORDER BY created_at DESC',
    [partnerId]
  );

  return c.json({ campaigns });
});

/**
 * POST /api/partners/campaigns
 * Create a new campaign
 */
router.post('/campaigns', verifyPartnerAuth, async (c) => {
  try {
    const body = await c.req.json();
    const campaign = campaignSchema.parse(body);
    const partnerId = c.get('partner_id');

    const id = await db.insert(
      c.env.DB,
      `INSERT INTO campaigns (partner_id, name, region, tag, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        partnerId,
        campaign.name,
        campaign.region,
        campaign.tag ?? null,
        campaign.start_date,
        campaign.end_date,
      ]
    );

    return c.json({ ok: true, campaign_id: id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to create campaign' }, 500);
  }
});

/**
 * POST /api/partners/creatives
 * Create a new creative
 */
router.post('/creatives', verifyPartnerAuth, async (c) => {
  try {
    const body = await c.req.json();
    const creative = creativeSchema.parse(body);

    // Verify campaign belongs to partner
    const campaign = await db.first(
      c.env.DB,
      'SELECT id FROM campaigns WHERE id = ? AND partner_id = ?',
      [creative.campaign_id, c.get('partner_id')]
    );

    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404);
    }

    const id = await db.insert(
      c.env.DB,
      `INSERT INTO creatives (campaign_id, title, body_md, image_url, target_url, cpm_rate, variant_group, weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creative.campaign_id,
        creative.title,
        creative.body_md,
        creative.image_url,
        creative.target_url,
        creative.cpm_rate,
        creative.variant_group ?? null,
        creative.weight ?? 1.0,
      ]
    );

    return c.json({ ok: true, creative_id: id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    return c.json({ error: 'Failed to create creative' }, 500);
  }
});

/**
 * GET /api/partners/analytics
 * Get campaign analytics
 */
router.get('/analytics', verifyPartnerAuth, async (c) => {
  const campaignId = c.req.query('campaign_id');

  if (!campaignId) {
    return c.json({ error: 'campaign_id required' }, 400);
  }

  // Verify campaign belongs to partner
  const campaign = await db.first(
    c.env.DB,
    'SELECT id FROM campaigns WHERE id = ? AND partner_id = ?',
    [parseInt(campaignId, 10), c.get('partner_id')]
  );

  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404);
  }

  // Get impression stats
  const stats = await db.first(
    c.env.DB,
    `SELECT
       COUNT(*) as total_impressions,
       SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
       SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks
     FROM ad_impressions ai
     JOIN ads a ON a.id = ai.ad_id
     WHERE ai.date >= date('now', '-30 days')`,
    []
  );

  return c.json({ stats });
});

export default router;
