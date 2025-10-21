import { Hono } from 'hono';
import type { Env } from '../types';
import * as db from '../lib/db';

const router = new Hono<{ Bindings: Env }>();

/**
 * GET /api/achievements
 * List all available achievements
 */
router.get('/', async (c) => {
  const category = c.req.query('category');
  const tier = c.req.query('tier');

  let query = 'SELECT * FROM achievements WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (tier) {
    query += ' AND tier = ?';
    params.push(tier);
  }

  query += ' ORDER BY category, requirement_value ASC';

  const achievements = await db.all(c.env.DB, query, params);

  return c.json({ achievements });
});

/**
 * GET /api/achievements/:userId
 * Get user's unlocked achievements
 */
router.get('/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  // Get unlocked achievements with full details
  const unlocked = await db.all(
    c.env.DB,
    `SELECT
       a.*,
       ua.unlocked_at,
       ua.notified
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = ?
     ORDER BY ua.unlocked_at DESC`,
    [userId]
  );

  // Get all achievements for progress tracking
  const allAchievements = await db.all(
    c.env.DB,
    'SELECT * FROM achievements ORDER BY category, requirement_value ASC'
  );

  // Get user's current stats for progress
  const streak = await db.first(
    c.env.DB,
    'SELECT * FROM streaks WHERE user_id = ?',
    [userId]
  );

  const journalCount = await db.first(
    c.env.DB,
    'SELECT COUNT(*) as count FROM journal WHERE user_id = ?',
    [userId]
  );

  const referralCount = await db.first(
    c.env.DB,
    'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ? AND reward_granted = 1',
    [userId]
  );

  // Calculate progress for each achievement
  const achievementsWithProgress = allAchievements.map((achievement: any) => {
    const isUnlocked = unlocked.some((u: any) => u.id === achievement.id);
    let progress = 0;
    let current = 0;

    if (!isUnlocked && achievement.requirement_value) {
      if (achievement.category === 'streak') {
        current = streak?.current_streak || 0;
        progress = Math.min((current / achievement.requirement_value) * 100, 100);
      } else if (achievement.category === 'journal') {
        current = journalCount?.count || 0;
        progress = Math.min((current / achievement.requirement_value) * 100, 100);
      } else if (achievement.category === 'social') {
        current = referralCount?.count || 0;
        progress = Math.min((current / achievement.requirement_value) * 100, 100);
      } else if (achievement.category === 'milestone' && achievement.code.startsWith('points_')) {
        current = streak?.total_points || 0;
        progress = Math.min((current / achievement.requirement_value) * 100, 100);
      }
    } else if (isUnlocked) {
      progress = 100;
      current = achievement.requirement_value;
    }

    return {
      ...achievement,
      unlocked: isUnlocked,
      unlocked_at: unlocked.find((u: any) => u.id === achievement.id)?.unlocked_at || null,
      progress,
      current,
      required: achievement.requirement_value,
    };
  });

  return c.json({
    unlocked: unlocked.length,
    total: allAchievements.length,
    achievements: achievementsWithProgress,
    stats: {
      current_streak: streak?.current_streak || 0,
      total_points: streak?.total_points || 0,
      journal_entries: journalCount?.count || 0,
      referrals: referralCount?.count || 0,
    },
  });
});

/**
 * PUT /api/achievements/:userId/:achievementId/mark-notified
 * Mark achievement notification as shown
 */
router.put('/:userId/:achievementId/mark-notified', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);
  const achievementId = parseInt(c.req.param('achievementId'), 10);

  if (isNaN(userId) || isNaN(achievementId)) {
    return c.json({ error: 'Invalid parameters' }, 400);
  }

  await db.execute(
    c.env.DB,
    'UPDATE user_achievements SET notified = 1 WHERE user_id = ? AND achievement_id = ?',
    [userId, achievementId]
  );

  return c.json({ ok: true });
});

/**
 * GET /api/achievements/:userId/leaderboard
 * Get user's position on leaderboard (anonymous)
 */
router.get('/:userId/leaderboard', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  // Get top 10 by total points (anonymous)
  const topUsers = await db.all(
    c.env.DB,
    `SELECT
       total_points,
       current_streak,
       longest_streak,
       ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
     FROM streaks
     ORDER BY total_points DESC
     LIMIT 10`
  );

  // Get user's rank
  const userRank = await db.first(
    c.env.DB,
    `SELECT
       total_points,
       current_streak,
       longest_streak,
       (SELECT COUNT(*) + 1 FROM streaks WHERE total_points > s.total_points) as rank
     FROM streaks s
     WHERE user_id = ?`,
    [userId]
  );

  return c.json({
    leaderboard: topUsers,
    user_rank: userRank || { rank: null, total_points: 0, current_streak: 0, longest_streak: 0 },
  });
});

export default router;
