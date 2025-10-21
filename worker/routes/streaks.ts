import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';
import * as db from '../lib/db';

const router = new Hono<{ Bindings: Env }>();

/**
 * Helper: Get user's timezone-adjusted current date
 */
function getUserDate(timezone?: string): string {
  const now = new Date();
  if (timezone) {
    // Use timezone-aware date calculation
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return tzDate.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}

/**
 * Helper: Calculate days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Helper: Check if user has an active streak save
 */
async function hasActiveStreakSave(env: Env, userId: number, currentDate: string): Promise<boolean> {
  const save = await db.first(
    env.DB,
    `SELECT * FROM streak_saves
     WHERE user_id = ? AND expires_at >= ? AND used = 0
     ORDER BY expires_at DESC LIMIT 1`,
    [userId, currentDate]
  );
  return !!save;
}

/**
 * Helper: Award points and check for milestone achievements
 */
async function awardPointsAndCheckAchievements(
  env: Env,
  userId: number,
  points: number,
  streakCount: number,
  checkType: string
): Promise<{ pointsAwarded: number; achievementsUnlocked: any[] }> {
  // Update total points
  await db.execute(
    env.DB,
    'UPDATE streaks SET total_points = total_points + ? WHERE user_id = ?',
    [points, userId]
  );

  const achievementsUnlocked: any[] = [];

  // Check for streak achievements
  const streakMilestones = [3, 7, 14, 30, 60, 100, 365];
  for (const milestone of streakMilestones) {
    if (streakCount === milestone) {
      const achievement = await db.first(
        env.DB,
        `SELECT * FROM achievements WHERE code = ?`,
        [`streak_${milestone}`]
      );

      if (achievement) {
        // Check if already unlocked
        const existing = await db.first(
          env.DB,
          'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
          [userId, achievement.id]
        );

        if (!existing) {
          await db.insert(
            env.DB,
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
            [userId, achievement.id]
          );

          // Award achievement points
          await db.execute(
            env.DB,
            'UPDATE streaks SET total_points = total_points + ? WHERE user_id = ?',
            [achievement.points, userId]
          );

          achievementsUnlocked.push(achievement);
        }
      }
    }
  }

  // Check for point milestones
  const userStreak = await db.first(
    env.DB,
    'SELECT total_points FROM streaks WHERE user_id = ?',
    [userId]
  );

  if (userStreak) {
    const pointMilestones = [1000, 5000, 10000];
    for (const milestone of pointMilestones) {
      if (userStreak.total_points >= milestone && userStreak.total_points - points < milestone) {
        const achievement = await db.first(
          env.DB,
          `SELECT * FROM achievements WHERE code = ?`,
          [`points_${milestone}`]
        );

        if (achievement) {
          const existing = await db.first(
            env.DB,
            'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
            [userId, achievement.id]
          );

          if (!existing) {
            await db.insert(
              env.DB,
              'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
              [userId, achievement.id]
            );
            achievementsUnlocked.push(achievement);
          }
        }
      }
    }
  }

  return { pointsAwarded: points, achievementsUnlocked };
}

/**
 * GET /api/streaks/:userId
 * Get user's current streak data
 */
router.get('/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  let streak = await db.first(
    c.env.DB,
    'SELECT * FROM streaks WHERE user_id = ?',
    [userId]
  );

  // Initialize streak record if doesn't exist
  if (!streak) {
    await db.insert(
      c.env.DB,
      'INSERT INTO streaks (user_id, current_streak, longest_streak, total_points) VALUES (?, 0, 0, 0)',
      [userId]
    );
    streak = {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_check_in: null,
      total_points: 0,
    };
  }

  // Check if streak is broken (more than 1 day gap without save)
  const currentDate = getUserDate();
  let streakStatus = 'active';

  if (streak.last_check_in) {
    const daysSinceLastCheckIn = daysBetween(streak.last_check_in, currentDate);

    if (daysSinceLastCheckIn > 1) {
      const hasActiveSave = await hasActiveStreakSave(c.env, userId, currentDate);

      if (!hasActiveSave && streak.current_streak > 0) {
        streakStatus = 'broken';
        // Note: We don't reset here automatically, wait for next check-in
      } else if (hasActiveSave) {
        streakStatus = 'saved';
      }
    } else if (daysSinceLastCheckIn === 0) {
      streakStatus = 'checked_in_today';
    }
  }

  return c.json({
    streak: {
      ...streak,
      status: streakStatus,
    },
  });
});

/**
 * POST /api/streaks/checkin
 * Record a daily check-in
 */
router.post('/checkin', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, timezone, check_type } = body;

    if (!user_id) {
      return c.json({ error: 'user_id required' }, 400);
    }

    const userId = parseInt(user_id, 10);
    const currentDate = getUserDate(timezone);
    const checkType = check_type || 'daily';

    // Get or create streak record
    let streak = await db.first(
      c.env.DB,
      'SELECT * FROM streaks WHERE user_id = ?',
      [userId]
    );

    if (!streak) {
      await db.insert(
        c.env.DB,
        'INSERT INTO streaks (user_id, current_streak, longest_streak, total_points) VALUES (?, 0, 0, 0)',
        [userId]
      );
      streak = { user_id: userId, current_streak: 0, longest_streak: 0, last_check_in: null, total_points: 0 };
    }

    // Check if already checked in today
    if (streak.last_check_in === currentDate) {
      return c.json({
        ok: true,
        message: 'Already checked in today',
        streak: streak.current_streak,
        points_earned: 0,
      });
    }

    let newStreak = 1;
    let streakAction = 'started';

    if (streak.last_check_in) {
      const daysSinceLastCheckIn = daysBetween(streak.last_check_in, currentDate);

      if (daysSinceLastCheckIn === 1) {
        // Consecutive day
        newStreak = streak.current_streak + 1;
        streakAction = 'continued';
      } else if (daysSinceLastCheckIn > 1) {
        // Check for active streak save
        const hasActiveSave = await hasActiveStreakSave(c.env, userId, currentDate);

        if (hasActiveSave) {
          // Use streak save
          newStreak = streak.current_streak + 1;
          streakAction = 'saved';

          // Mark save as used
          await db.execute(
            c.env.DB,
            `UPDATE streak_saves SET used = 1
             WHERE user_id = ? AND expires_at >= ? AND used = 0`,
            [userId, currentDate]
          );

          // Award comeback achievement
          const comebackAchievement = await db.first(
            c.env.DB,
            `SELECT * FROM achievements WHERE code = 'comeback_kid'`
          );

          if (comebackAchievement) {
            const existing = await db.first(
              c.env.DB,
              'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
              [userId, comebackAchievement.id]
            );

            if (!existing) {
              await db.insert(
                c.env.DB,
                'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
                [userId, comebackAchievement.id]
              );
            }
          }
        } else {
          // Streak broken, restart
          newStreak = 1;
          streakAction = 'reset';
        }
      }
    }

    // Calculate new longest streak
    const newLongest = Math.max(streak.longest_streak || 0, newStreak);

    // Update streak record
    await db.execute(
      c.env.DB,
      `UPDATE streaks
       SET current_streak = ?,
           longest_streak = ?,
           last_check_in = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newStreak, newLongest, currentDate, userId]
    );

    // Award points (10 base + 1 per streak day, capped at 50)
    const pointsEarned = Math.min(10 + newStreak, 50);

    // Log check-in history
    await db.insert(
      c.env.DB,
      `INSERT INTO checkin_history (user_id, check_in_date, check_in_type, points_earned, streak_count)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, currentDate, checkType, pointsEarned, newStreak]
    );

    // Award points and check achievements
    const { achievementsUnlocked } = await awardPointsAndCheckAchievements(
      c.env,
      userId,
      pointsEarned,
      newStreak,
      checkType
    );

    return c.json({
      ok: true,
      action: streakAction,
      streak: newStreak,
      longest_streak: newLongest,
      points_earned: pointsEarned,
      achievements_unlocked: achievementsUnlocked,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return c.json({
      error: 'Failed to process check-in',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/streaks/save
 * Save streak (watch ad or use premium perk)
 */
router.post('/save', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, method } = body;

    if (!user_id) {
      return c.json({ error: 'user_id required' }, 400);
    }

    const userId = parseInt(user_id, 10);
    const saveMethod = method || 'watch_ad';

    // Check if user already has an active save
    const currentDate = getUserDate();
    const existingSave = await db.first(
      c.env.DB,
      `SELECT * FROM streak_saves
       WHERE user_id = ? AND expires_at >= ? AND used = 0`,
      [userId, currentDate]
    );

    if (existingSave) {
      return c.json({
        ok: false,
        error: 'You already have an active streak save',
        expires_at: existingSave.expires_at,
      }, 400);
    }

    // Create streak save (12 hour grace period)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);
    const expiresAtStr = expiresAt.toISOString().split('T')[0];

    await db.insert(
      c.env.DB,
      `INSERT INTO streak_saves (user_id, method, expires_at)
       VALUES (?, ?, ?)`,
      [userId, saveMethod, expiresAtStr]
    );

    return c.json({
      ok: true,
      message: 'Streak save activated',
      method: saveMethod,
      expires_at: expiresAtStr,
    });
  } catch (error) {
    console.error('Streak save error:', error);
    return c.json({
      error: 'Failed to save streak',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/streaks/:userId/history
 * Get check-in history
 */
router.get('/:userId/history', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);
  const days = parseInt(c.req.query('days') || '30', 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  const history = await db.all(
    c.env.DB,
    `SELECT * FROM checkin_history
     WHERE user_id = ?
       AND check_in_date >= date('now', '-' || ? || ' days')
     ORDER BY check_in_date DESC`,
    [userId, days]
  );

  return c.json({ history });
});

export default router;
