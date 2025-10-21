import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';
import * as db from '../lib/db';

const router = new Hono<{ Bindings: Env }>();

// Notification scheduling schema
const scheduleNotificationSchema = z.object({
  user_id: z.number().optional(),
  notification_type: z.string(),
  title: z.string(),
  body: z.string(),
  icon_url: z.string().optional(),
  url: z.string().optional(),
  send_now: z.boolean().optional(),
});

/**
 * POST /api/notifications/schedule
 * Schedule a notification to be sent
 */
router.post('/schedule', async (c) => {
  try {
    const body = await c.req.json();
    const notification = scheduleNotificationSchema.parse(body);

    if (notification.send_now) {
      // Send immediately via queue
      await c.env.DAILY_QUEUE.send({
        notification_type: notification.notification_type,
        title: notification.title,
        body: notification.body,
        icon: notification.icon_url || '/icon-192.png',
        url: notification.url || '/',
        user_id: notification.user_id,
      });

      return c.json({ ok: true, message: 'Notification queued for immediate delivery' });
    } else {
      // Schedule for later (would need a cron trigger or scheduled worker)
      return c.json({
        ok: false,
        message: 'Scheduled notifications not yet implemented - use send_now: true',
      }, 501);
    }
  } catch (error) {
    console.error('Schedule notification error:', error);
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request body', details: error.errors }, 400);
    }
    return c.json({
      error: 'Failed to schedule notification',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/notifications/history/:userId
 * Get notification history for a user
 */
router.get('/history/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  const history = await db.all(
    c.env.DB,
    `SELECT * FROM notification_history
     WHERE user_id = ?
     ORDER BY sent_at DESC
     LIMIT ?`,
    [userId, Math.min(limit, 100)]
  );

  return c.json({ history });
});

/**
 * GET /api/notifications/preferences/:userId
 * Get user's notification preferences
 */
router.get('/preferences/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  let prefs = await db.first(
    c.env.DB,
    'SELECT * FROM notification_preferences WHERE user_id = ?',
    [userId]
  );

  // Create default preferences if none exist
  if (!prefs) {
    await db.insert(
      c.env.DB,
      'INSERT INTO notification_preferences (user_id) VALUES (?)',
      [userId]
    );
    prefs = {
      user_id: userId,
      daily_content_enabled: 1,
      daily_content_time: '09:00',
      journal_reminder_enabled: 1,
      journal_reminder_time: '20:00',
      streak_alert_enabled: 1,
      streak_alert_time: '23:00',
      achievement_enabled: 1,
      partner_campaign_enabled: 0,
    };
  }

  return c.json({ preferences: prefs });
});

/**
 * PUT /api/notifications/preferences/:userId
 * Update user's notification preferences
 */
router.put('/preferences/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'), 10);

  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user_id' }, 400);
  }

  try {
    const body = await c.req.json();

    // Ensure record exists
    const existing = await db.first(
      c.env.DB,
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    );

    if (!existing) {
      await db.insert(
        c.env.DB,
        'INSERT INTO notification_preferences (user_id) VALUES (?)',
        [userId]
      );
    }

    // Update preferences
    const updates: string[] = [];
    const params: any[] = [];

    if (body.daily_content_enabled !== undefined) {
      updates.push('daily_content_enabled = ?');
      params.push(body.daily_content_enabled ? 1 : 0);
    }
    if (body.daily_content_time) {
      updates.push('daily_content_time = ?');
      params.push(body.daily_content_time);
    }
    if (body.journal_reminder_enabled !== undefined) {
      updates.push('journal_reminder_enabled = ?');
      params.push(body.journal_reminder_enabled ? 1 : 0);
    }
    if (body.journal_reminder_time) {
      updates.push('journal_reminder_time = ?');
      params.push(body.journal_reminder_time);
    }
    if (body.streak_alert_enabled !== undefined) {
      updates.push('streak_alert_enabled = ?');
      params.push(body.streak_alert_enabled ? 1 : 0);
    }
    if (body.streak_alert_time) {
      updates.push('streak_alert_time = ?');
      params.push(body.streak_alert_time);
    }
    if (body.achievement_enabled !== undefined) {
      updates.push('achievement_enabled = ?');
      params.push(body.achievement_enabled ? 1 : 0);
    }
    if (body.partner_campaign_enabled !== undefined) {
      updates.push('partner_campaign_enabled = ?');
      params.push(body.partner_campaign_enabled ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);

      await db.execute(
        c.env.DB,
        `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
        params
      );
    }

    return c.json({ ok: true, message: 'Preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    return c.json({
      error: 'Failed to update preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default router;
