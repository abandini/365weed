import { Hono } from 'hono';
import * as db from '../lib/db';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /api/recommendations/:userId
 * Get personalized content recommendations
 */
router.get('/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  // Get user's journal patterns
  const patterns = await db.first(
    c.env.DB,
    `SELECT
       AVG(CASE WHEN mood_after - mood_before > 0 THEN 1 ELSE 0 END) as mood_improvement_rate,
       AVG(sleep_hours) as avg_sleep,
       GROUP_CONCAT(DISTINCT method) as methods_used
     FROM journal WHERE user_id = ?`,
    [userId]
  );

  // Get user preferences if they exist
  const prefs = await db.first(
    c.env.DB,
    'SELECT * FROM user_preferences WHERE user_id = ?',
    [userId]
  );

  // Simple recommendation: return recent unread content
  // In production, this would use ML/collaborative filtering
  const recommendations = await db.all(
    c.env.DB,
    `SELECT * FROM day_cards
     WHERE published_at IS NOT NULL
     ORDER BY date DESC LIMIT 5`
  );

  return c.json({
    recommendations,
    based_on: {
      avg_sleep: patterns?.avg_sleep || 0,
      mood_improvement: patterns?.mood_improvement_rate || 0,
      preferences: prefs
    }
  });
});

export default router;
