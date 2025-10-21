import { Hono } from 'hono';
import * as db from '../lib/db';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /api/community/stats
 * Get anonymous community statistics
 */
router.get('/stats', async (c) => {
  const region = c.req.query('region') || 'all';

  // Daily active users (privacy: only show if >10 users)
  const activeUsers = await db.first(
    c.env.DB,
    `SELECT COUNT(DISTINCT user_id) as count
     FROM checkin_history
     WHERE check_in_date >= date('now', '-1 day')`
  );

  // Average mood improvement
  const moodStats = await db.first(
    c.env.DB,
    `SELECT
       AVG(mood_after - mood_before) as avg_improvement,
       COUNT(*) as total_entries
     FROM journal
     WHERE date >= date('now', '-7 days')`
  );

  // Top methods this week
  const topMethods = await db.all(
    c.env.DB,
    `SELECT method, COUNT(*) as count
     FROM journal
     WHERE date >= date('now', '-7 days')
     GROUP BY method
     ORDER BY count DESC
     LIMIT 5`
  );

  // Privacy: only show if sufficient data
  if (!activeUsers || activeUsers.count < 10) {
    return c.json({
      message: 'Insufficient data for privacy protection',
      active_users: null
    });
  }

  return c.json({
    active_users_24h: Math.round(activeUsers.count / 5) * 5, // Round to nearest 5
    avg_mood_improvement: Math.round((moodStats?.avg_improvement || 0) * 20) / 20, // Round to 0.05
    total_entries_week: moodStats?.total_entries || 0,
    top_methods: topMethods
  });
});

export default router;
