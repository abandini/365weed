import { Hono } from 'hono';
import * as db from '../lib/db';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

// Generate referral code
function generateReferralCode(userId: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WEED${userId}${code}`;
}

/**
 * GET /api/referrals/code/:userId - Get or create referral code
 */
router.get('/code/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  // Check if user already has a referral
  let referral = await db.first(
    c.env.DB,
    'SELECT * FROM referrals WHERE referrer_id = ? AND referred_user_id IS NULL LIMIT 1',
    [userId]
  );

  if (!referral) {
    const code = generateReferralCode(userId);
    const id = await db.insert(
      c.env.DB,
      'INSERT INTO referrals (referrer_id, referral_code) VALUES (?, ?)',
      [userId, code]
    );
    referral = { id, referrer_id: userId, referral_code: code, reward_granted: 0 };
  }

  return c.json({ referral_code: referral.referral_code });
});

/**
 * POST /api/referrals/validate - Validate and apply referral code
 */
router.post('/validate', async (c) => {
  const { code, new_user_id } = await c.req.json();

  const referral = await db.first(
    c.env.DB,
    'SELECT * FROM referrals WHERE referral_code = ?',
    [code]
  );

  if (!referral) {
    return c.json({ error: 'Invalid referral code' }, 400);
  }

  if (referral.referred_user_id) {
    return c.json({ error: 'Referral code already used' }, 400);
  }

  // Update referral with new user
  await db.execute(
    c.env.DB,
    'UPDATE referrals SET referred_user_id = ?, signup_date = CURRENT_TIMESTAMP WHERE id = ?',
    [new_user_id, referral.id]
  );

  // Grant rewards
  await db.execute(
    c.env.DB,
    'UPDATE referrals SET reward_granted = 1 WHERE id = ?',
    [referral.id]
  );

  // Give referred user points
  await db.execute(
    c.env.DB,
    'INSERT OR REPLACE INTO streaks (user_id, total_points) VALUES (?, 500)',
    [new_user_id]
  );

  return c.json({ ok: true, referrer_id: referral.referrer_id });
});

/**
 * GET /api/referrals/stats/:userId - Get referral stats
 */
router.get('/stats/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  const stats = await db.first(
    c.env.DB,
    `SELECT COUNT(*) as total, SUM(reward_granted) as rewarded
     FROM referrals WHERE referrer_id = ? AND referred_user_id IS NOT NULL`,
    [userId]
  );

  return c.json({ stats });
});

export default router;
